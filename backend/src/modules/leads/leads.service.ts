import { LeadModel } from './lead.model.js';
import { ActivityModel } from './activity.model.js';
import { PipelineModel } from '../pipelines/pipeline.model.js';
import { StageModel } from '../pipelines/stage.model.js';
import { AppError } from '../../common/http.js';
import { StatusCodes } from 'http-status-codes';
import mongoose from 'mongoose';
import { ActivityService } from '../../services/activity.service.js';
import { UserModel } from '../users/user.model.js';

// Interfaces
interface UserAuth {
  sub: string;
  role: string;
}

interface LeadFilter {
  owners?: string;
  search?: string;
  name?: string;
  qualificationStatus?: string;
  origin?: string;
  startDate?: string;
  endDate?: string;
  pipelineId?: string;
  stageId?: string;
}

export async function listLeads(filter: LeadFilter = {}, user?: UserAuth) {
  const query: any = {};

  // --- 1. REGRA DE SEGURANÇA ---
  if (user && user.role !== 'admin') {
    query.owners = user.sub;
  } 
  else if (filter.owners) {
    query.owners = filter.owners;
  }

 // --- 2. BUSCA TEXTUAL ---
  if (filter.search || filter.name) {
    const searchTerm = filter.search || filter.name;
    const regex = { $regex: searchTerm, $options: 'i' };
    query.$or = [
      { name: regex },
      { email: regex },
      { phone: regex }
    ];
  }

  // --- 3. FILTROS ---
  if (filter.qualificationStatus && filter.qualificationStatus !== 'all') {
    query.qualificationStatus = filter.qualificationStatus;
  }

  if (filter.origin && filter.origin !== 'all') {
    query.origin = filter.origin;
  }

  // Filtro de Data
  if (filter.startDate || filter.endDate) {
    query.createdAt = {};
    if (filter.startDate) {
      query.createdAt.$gte = new Date(filter.startDate);
    }
    if (filter.endDate) {
      const endDate = new Date(filter.endDate);
      endDate.setDate(endDate.getDate() + 1); 
      query.createdAt.$lte = endDate;
    }
  }

  if (filter.pipelineId) {
    query.pipelineId = filter.pipelineId;
  }

  if (filter.stageId) {
    query.stageId = filter.stageId;
  }

  return LeadModel.find(query)
    .sort({ createdAt: -1 })
    .populate('owners', 'name email') 
    .populate('owner', 'name email');
}

export function getLead(id: string) {
  return LeadModel.findById(id)
    .populate('owners', 'name email')
    .populate('owner', 'name email')
    .lean();
}

// Lógica de Distribuição (Fila)
async function findNextResponsible(lives: number, hasCnpj: boolean) {
  const cnpjFilter = hasCnpj 
    ? { $in: ['required', 'both'] } 
    : { $in: ['forbidden', 'both'] };

  const bestSeller = await UserModel.findOne({
    active: true,                       
    'distribution.active': true,        
    'distribution.minLives': { $lte: lives }, 
    'distribution.maxLives': { $gte: lives }, 
    'distribution.cnpjRule': cnpjFilter       
  })
  .sort({ 'distribution.lastLeadReceivedAt': 1 }) 
  .select('_id name distribution');

  if (bestSeller) {
    await UserModel.updateOne(
      { _id: bestSeller._id },
      { $set: { 'distribution.lastLeadReceivedAt': new Date() } }
    );
    return bestSeller._id.toString();
  }

  return null; 
}

export async function createLead(input: any, user?: UserAuth) {

  // ===========================================================================
  // 1. VERIFICAÇÃO DE DUPLICIDADE (Lógica de Upsert/Histórico)
  // ===========================================================================
  const existingLead = await LeadModel.findOne({
    $or: [
      { email: input.email }, 
      { phone: input.phone }
    ]
  });

  if (existingLead) {
    // --- ATUALIZAÇÃO DE LEAD EXISTENTE ---
    
    const historico = `
    \n[NOVA ENTRADA VIA WEBHOOK/SISTEMA - ${new Date().toLocaleString('pt-BR')}]
    \nDados anteriores antes da substituição:
    \n- Nome: ${existingLead.name}
    \n- Telefone: ${existingLead.phone}
    \n- Email: ${existingLead.email || 'Não informado'}
    \n- Investimento: ${existingLead.avgPrice || '0'}
    \n- Vidas: ${existingLead.livesCount || '0'}
    \n ---------------------------------------------------
    `;

    const novasObservacoes = existingLead.notes 
      ? existingLead.notes + "\n" + historico 
      : historico;

    const updatedLead = await LeadModel.findByIdAndUpdate(
      existingLead._id,
      {
        ...input,
        notes: novasObservacoes,
        lastActivity: new Date(),
        updatedBy: user?.sub || 'Sistema'
      },
      { new: true }
    );

    // LOG: Atividade no Novo Service (Padronização)
    await ActivityService.createActivity({
      leadId: existingLead._id.toString(),
      tipo: 'lead_atualizado',
      descricao: `Lead re-convertido (Duplicidade detectada). Histórico salvo.`,
      userId: user?.sub || 'sistema',
      userName: user?.sub ? 'Usuário' : 'Sistema'
    });

    console.log(`Lead atualizado (Duplicado): ${updatedLead?.name}`);
    return updatedLead;
  }

  // ===========================================================================
  // 2. CRIAÇÃO DE NOVO LEAD
  // ===========================================================================

  if (input.cnpjType === '') {
    delete input.cnpjType;
  }
  
  const pipeline = await PipelineModel.findById(input.pipelineId);
  if (!pipeline) throw new AppError('Pipeline inválido', StatusCodes.BAD_REQUEST);
  
  const stage = await StageModel.findById(input.stageId);
  if (!stage) throw new AppError('Stage inválido', StatusCodes.BAD_REQUEST);

  const rank = input.rank || '0|hzzzzz:';
  
  // --- DISTRIBUIÇÃO ---
  let ownerId = user?.sub; 

  if (!ownerId && input.livesCount) {
    const distributedOwner = await findNextResponsible(
      input.livesCount, 
      input.hasCnpj || false 
    );
    
    if (distributedOwner) {
      ownerId = distributedOwner;
    } else {
      console.warn(`[DISTRIBUIÇÃO] Nenhum vendedor encontrado para ${input.livesCount} vidas.`);
    }
  }

  let ownersList = input.owners;
  if (!ownersList || ownersList.length === 0) {
    ownersList = ownerId ? [ownerId] : [];
  }

  const lead = await LeadModel.create({ 
    ...input, 
    owners: ownersList,
    rank, 
    createdBy: user?.sub, 
    active: true,
    createdAt: input.createdAt || new Date(),
    lastActivity: input.createdAt || new Date()
  });

  // LOG: Novo ActivityService
  const userId = user?.sub || 'sistema';
  const userDoc = user?.sub ? await UserModel.findById(user.sub) : null;
  const userName = userDoc?.name || 'Sistema';
  
  await ActivityService.createActivity({
    leadId: lead._id.toString(),
    tipo: 'lead_criado',
    descricao: `Lead criado por ${userName}`,
    userId: userId,
    userName: userName
  });

  return lead;
}

export async function updateLead(id: string, input: any, user?: UserAuth) {
  const existingLead = await LeadModel.findById(id);
  if (!existingLead) throw new AppError('Lead não encontrado', StatusCodes.NOT_FOUND);

  if (user && user.role !== 'admin') {
    const owners = existingLead.owners || [];
    const isOwner = owners.some((ownerId: any) => ownerId.toString() === user.sub);
    
    if (!isOwner) {
      throw new AppError('Você não tem permissão para editar este lead.', StatusCodes.FORBIDDEN);
    }
  }

  const lead = await LeadModel.findByIdAndUpdate(
      id, 
      { ...input, updatedBy: user?.sub }, 
      { new: true }
    )
    .populate('owners', 'name email')
    .populate('owner', 'name email');
  
  // --- LOG DE ATIVIDADES INTELIGENTE ---
  const userId = user?.sub || 'sistema';
  const userDoc = user?.sub ? await UserModel.findById(user.sub) : null;
  const userName = userDoc?.name || 'Sistema';

  // 1. Mudança de stage
  if (input.stageId && input.stageId !== existingLead.stageId?.toString()) {
    const oldStage = await StageModel.findById(existingLead.stageId);
    const newStage = await StageModel.findById(input.stageId);
    
    await ActivityService.createActivity({
      leadId: id,
      tipo: 'lead_movido',
      descricao: `${userName} moveu o lead de "${oldStage?.name || 'N/A'}" para "${newStage?.name || 'N/A'}"`,
      userId: userId,
      userName: userName,
      metadata: {
        from: oldStage?.name || 'N/A',
        to: newStage?.name || 'N/A'
      }
    });
  }

  // 2. Mudança de responsáveis
  const oldOwners = existingLead.owners?.map((o: any) => o.toString()).sort() || [];
  const newOwners = input.owners?.map((o: any) => o.toString()).sort() || [];
  
  if (input.owners && JSON.stringify(oldOwners) !== JSON.stringify(newOwners)) {
    await ActivityService.createActivity({
      leadId: id,
      tipo: 'responsavel_alterado',
      descricao: `${userName} alterou os responsáveis pelo lead`,
      userId: userId,
      userName: userName
    });
  }

  // 3. Mudança de status de qualificação
  if (input.qualificationStatus && input.qualificationStatus !== existingLead.qualificationStatus) {
    await ActivityService.createActivity({
      leadId: id,
      tipo: 'status_alterado',
      descricao: `${userName} alterou o status de qualificação para "${input.qualificationStatus}"`,
      userId: userId,
      userName: userName,
      metadata: {
        from: existingLead.qualificationStatus || 'N/A',
        to: input.qualificationStatus
      }
    });
  }

  // 4. Atividade genérica
  await ActivityService.createActivity({
    leadId: id,
    tipo: 'lead_atualizado',
    descricao: `${userName} atualizou os dados do lead`,
    userId: userId,
    userName: userName
  });
  
  return lead;
}

export async function deleteLead(id: string, user?: UserAuth) {
  const existingLead = await LeadModel.findById(id);
  if (!existingLead) return; 

  if (user && user.role !== 'admin') {
     const owners = existingLead.owners || [];
     const isOwner = owners.some((ownerId: any) => ownerId.toString() === user.sub);
     
     if (!isOwner) {
       throw new AppError('Você não tem permissão para excluir este lead.', StatusCodes.FORBIDDEN);
     }
  }

  return LeadModel.findByIdAndDelete(id);
}

export async function addActivity(leadId: string, tipo: string, payload: any, userId?: string) {
  const lead = await LeadModel.findById(leadId);
  if (!lead) throw new AppError('Lead não encontrado', StatusCodes.NOT_FOUND);
  
  const descricao = payload.description || payload.descricao || 'Nova atividade registrada';

  return ActivityService.createActivity({
    leadId,
    tipo: 'observacao_adicionada',
    descricao: payload.description || payload.descricao || 'Nova atividade',
    userId: userId || 'sistema',
    userName: 'Sistema'
  });
}