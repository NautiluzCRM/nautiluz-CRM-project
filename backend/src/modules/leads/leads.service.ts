import { LeadModel } from './lead.model.js';
import { ActivityModel } from './activity.model.js'; 
import { PipelineModel } from '../pipelines/pipeline.model.js';
import { StageModel } from '../pipelines/stage.model.js';
import { AppError } from '../../common/http.js';
import { StatusCodes } from 'http-status-codes';
import mongoose from 'mongoose';
import { ActivityService } from '../../services/activity.service.js';
import { UserModel } from '../users/user.model.js';

// --- ID FIXO DO SISTEMA ---
const SYSTEM_ID = '000000000000000000000000';

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

  if (user && user.role !== 'admin') {
    query.owners = user.sub;
  } 
  else if (filter.owners) {
    query.owners = filter.owners;
  }

  if (filter.search || filter.name) {
    const searchTerm = filter.search || filter.name;
    const regex = { $regex: searchTerm, $options: 'i' };
    query.$or = [
      { name: regex },
      { email: regex },
      { phone: regex }
    ];
  }

  if (filter.qualificationStatus && filter.qualificationStatus !== 'all') {
    query.qualificationStatus = filter.qualificationStatus;
  }

  if (filter.origin && filter.origin !== 'all') {
    query.origin = filter.origin;
  }

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

export async function findNextResponsible(lives: any, hasCnpj: boolean) {
  const livesNumber = Number(lives);

  const cnpjFilter = hasCnpj 
    ? { $in: ['required', 'both'] } 
    : { $in: ['forbidden', 'both'] };

  const bestSeller = await UserModel.findOne({
    active: true,                       
    'distribution.active': true,        
    'distribution.minLives': { $lte: livesNumber }, 
    'distribution.maxLives': { $gte: livesNumber }, 
    'distribution.cnpjRule': cnpjFilter       
  })
  .sort({ 'distribution.lastLeadReceivedAt': 1, _id: 1 }) 
  .select('_id name distribution');

  if (bestSeller) {
    console.log(`[DISTRIBUIÇÃO] 🎯 Lead (${livesNumber} vidas) entregue para: ${bestSeller.name}`);
    console.log(`   📅 Última vez que ele recebeu antes de agora: ${bestSeller.distribution?.lastLeadReceivedAt || 'NUNCA'}`);

    await UserModel.updateOne(
      { _id: bestSeller._id },
      { $set: { 'distribution.lastLeadReceivedAt': new Date() } }
    );
    
    return bestSeller._id.toString();
  }

  console.warn(`[DISTRIBUIÇÃO] ⚠️ Ninguém atende o perfil: ${livesNumber} vidas | CNPJ: ${hasCnpj}`);
  return null; 
}

export async function createLead(input: any, user?: UserAuth) {

  // 1. VERIFICAÇÃO DE DUPLICIDADE (BUSCA INTELIGENTE)
  const criteriosBusca: any[] = [{ phone: input.phone }];

  if (input.email && input.email.trim() !== '') {
    criteriosBusca.push({ email: input.email });
  }

  const existingLead = await LeadModel.findOne({
    $or: criteriosBusca
  });

  if (existingLead) {
    // --- LÓGICA DE ATUALIZAÇÃO POR DUPLICIDADE ---
    
    // 🧹 LIMPEZA: Removemos toda a lógica que criava o texto "historico" 
    // e concatenava nas notas. Agora atualizamos apenas os dados.

    const updatedLead = await LeadModel.findByIdAndUpdate(
      existingLead._id,
      {
        ...input,
        // notes: ... (REMOVIDO: Não alteramos mais as notas aqui)
        lastActivity: new Date(),
        updatedBy: user?.sub || SYSTEM_ID 
      },
      { new: true }
    );

    await ActivityService.createActivity({
      leadId: existingLead._id.toString(),
      tipo: 'lead_atualizado' as any, 
      descricao: 'Lead atualizado via nova submissão (Duplicidade)',
      userId: user?.sub || SYSTEM_ID,
      userName: user?.sub ? 'Usuário' : 'Sistema'
    });

    console.log(`Lead atualizado (Duplicado): ${updatedLead?.name}`);
    return updatedLead;
  }

  // 2. CRIAÇÃO DE NOVO LEAD
  if (input.cnpjType === '') {
    delete input.cnpjType;
  }
  
  const pipeline = await PipelineModel.findById(input.pipelineId);
  if (!pipeline) throw new AppError('Pipeline inválido', StatusCodes.BAD_REQUEST);
  
  const stage = await StageModel.findById(input.stageId);
  if (!stage) throw new AppError('Stage inválido', StatusCodes.BAD_REQUEST);

  const rank = input.rank || '0|hzzzzz:';
  
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

  // RESTRIÇÃO: Vendedores só podem criar leads para si mesmos
  // Admins podem criar para qualquer vendedor
  if (user && user.role === 'vendedor') {
    ownersList = [user.sub];
  }

  const createdById = user?.sub || SYSTEM_ID;

  const lead = await LeadModel.create({ 
    ...input, 
    owners: ownersList,
    rank, 
    createdBy: createdById, 
    active: true,
    createdAt: input.createdAt || new Date(),
    lastActivity: input.createdAt || new Date()
  });

  const creatorId = user?.sub;
  const userDoc = creatorId ? await UserModel.findById(creatorId) : null;
  const userName = userDoc?.name || 'Sistema';
  const finalUserId = creatorId || SYSTEM_ID;

  const descricaoLog = input.customCreationLog || `Lead criado por ${userName}`;

  await ActivityService.createActivity({
    leadId: lead._id.toString(),
    tipo: 'lead_criado',
    descricao: descricaoLog,
    userId: finalUserId,
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

  const updatedById = user?.sub || SYSTEM_ID;

  const lead = await LeadModel.findByIdAndUpdate(
      id, 
      { ...input, updatedBy: updatedById }, 
      { new: true }
    )
    .populate('owners', 'name email')
    .populate('owner', 'name email');
  
  const updatorId = user?.sub;
  const userDoc = updatorId ? await UserModel.findById(updatorId) : null;
  const userName = userDoc?.name || 'Sistema';
  const finalUserId = updatorId || SYSTEM_ID;

  // 1. Mudança de stage
  if (input.stageId && input.stageId !== existingLead.stageId?.toString()) {
    const oldStage = await StageModel.findById(existingLead.stageId);
    const newStage = await StageModel.findById(input.stageId);
    
    await ActivityService.createActivity({
      leadId: id,
      tipo: 'lead_movido' as any,
      descricao: `${userName} moveu o lead de "${oldStage?.name || 'N/A'}" para "${newStage?.name || 'N/A'}"`,
      userId: finalUserId,
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
      tipo: 'responsavel_alterado' as any,
      descricao: `${userName} alterou os responsáveis pelo lead`,
      userId: finalUserId,
      userName: userName
    });
  }

  // 3. Mudança de status
  if (input.qualificationStatus && input.qualificationStatus !== existingLead.qualificationStatus) {
    await ActivityService.createActivity({
      leadId: id,
      tipo: 'status_alterado' as any,
      descricao: `${userName} alterou o status de qualificação para "${input.qualificationStatus}"`,
      userId: finalUserId,
      userName: userName,
      metadata: {
        from: existingLead.qualificationStatus || 'N/A',
        to: input.qualificationStatus
      }
    });
  }

  // 4. Atividade genérica
  const descricaoLog = input.customUpdateLog || `${userName} atualizou os dados do lead`;
  
  const isSpecificAction = input.stageId || input.owners || input.qualificationStatus;

  if (!isSpecificAction || input.customUpdateLog) {
    await ActivityService.createActivity({
      leadId: id,
      tipo: 'lead_atualizado',
      descricao: descricaoLog, 
      userId: finalUserId,
      userName: userName
    });
  }
  
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

export async function addActivity(leadId: string, type: string, payload: any, userId?: string) {
  const lead = await LeadModel.findById(leadId);
  if (!lead) throw new AppError('Lead não encontrado', StatusCodes.NOT_FOUND);
  
  const descricao = payload.description || payload.descricao || 'Nova atividade registrada';

  const finalUserId = (userId && mongoose.Types.ObjectId.isValid(userId)) ? userId : SYSTEM_ID;
  
  let finalUserName = 'Sistema';
  if (userId && userId !== SYSTEM_ID && mongoose.Types.ObjectId.isValid(userId)) {
    try {
      const user = await UserModel.findById(userId);
      if (user) finalUserName = user.name;
    } catch (err) { }
  }

  let novoTipo = type;
  if (type === 'Sistema' || type === 'Alteração') {
    novoTipo = 'lead_atualizado'; 
  }

  return ActivityService.createActivity({
    leadId,
    tipo: novoTipo as any, 
    descricao,
    userId: finalUserId,
    userName: finalUserName,
    metadata: payload
  });
}