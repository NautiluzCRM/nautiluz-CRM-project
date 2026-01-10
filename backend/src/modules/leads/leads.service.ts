import { LeadModel } from './lead.model.js';
import { ActivityModel } from './activity.model.js'; // Mantido para compatibilidade se necessário
import { PipelineModel } from '../pipelines/pipeline.model.js';
import { StageModel } from '../pipelines/stage.model.js';
import { AppError } from '../../common/http.js';
import { StatusCodes } from 'http-status-codes';
import mongoose from 'mongoose';
import { ActivityService } from '../../services/activity.service.js';
import { UserModel } from '../users/user.model.js';

// --- CONSTANTE PARA EVITAR ERRO DE BSON/OBJECTID ---
// O MongoDB exige que IDs sejam hexadecimais de 24 caracteres. 
// "Sistema" não é válido, então usamos este ID zerado para representar o sistema.
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

  // 1. REGRA DE SEGURANÇA
  if (user && user.role !== 'admin') {
    query.owners = user.sub;
  } 
  else if (filter.owners) {
    query.owners = filter.owners;
  }

 // 2. BUSCA TEXTUAL
  if (filter.search || filter.name) {
    const searchTerm = filter.search || filter.name;
    const regex = { $regex: searchTerm, $options: 'i' };
    query.$or = [
      { name: regex },
      { email: regex },
      { phone: regex }
    ];
  }

  // 3. FILTROS
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
    .populate('owner', 'name email');
}

// Lógica de Distribuição (Fila)
// VERSÃO DE DIAGNÓSTICO (DEBUG)
// Lógica de Distribuição (Fila / Round Robin)
export async function findNextResponsible(lives: any, hasCnpj: boolean) {
  const livesNumber = Number(lives);

  // Filtro de CNPJ
  const cnpjFilter = hasCnpj 
    ? { $in: ['required', 'both'] } 
    : { $in: ['forbidden', 'both'] };

  // BUSCA INTELIGENTE
  const bestSeller = await UserModel.findOne({
    active: true,                       
    'distribution.active': true,        
    
    // Regra do Range (Matemática)
    'distribution.minLives': { $lte: livesNumber }, 
    'distribution.maxLives': { $gte: livesNumber }, 
    
    'distribution.cnpjRule': cnpjFilter       
  })
  // ORDENAÇÃO (O SEGRED DA FILA):
  // 1. Quem recebeu há mais tempo (data menor/mais antiga)
  // 2. Se empatar (ou for nulo), usa o ID para garantir ordem fixa e não aleatória
  .sort({ 'distribution.lastLeadReceivedAt': 1, _id: 1 }) 
  .select('_id name distribution');

  if (bestSeller) {
    console.log(`[DISTRIBUIÇÃO] 🎯 Lead (${livesNumber} vidas) entregue para: ${bestSeller.name}`);
    console.log(`   📅 Última vez que ele recebeu antes de agora: ${bestSeller.distribution?.lastLeadReceivedAt || 'NUNCA'}`);

    // ATUALIZA A VEZ DELE (Joga ele pro final da fila)
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
    // --- LÓGICA DE ATUALIZAÇÃO SE JÁ EXISTIR ---
    const historico = `
    \n[NOVA ENTRADA VIA WEBHOOK/SISTEMA - ${new Date().toLocaleString('pt-BR')}]
    \nDados anteriores antes da substituição:
    \n- Nome: ${existingLead.name}
    \n- Telefone: ${existingLead.phone}
    \n- Email: ${existingLead.email || 'Não informado'}
    \n ---------------------------------------------------
    `;

    // Adiciona o histórico novo nas observações existentes
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

    // Registra atividade usando o SYSTEM_ID se necessário
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

  // ===========================================================================
  // 2. LÓGICA DE CRIAÇÃO (SE NÃO EXISTIR)
  // ===========================================================================

  if (input.cnpjType === '') {
    delete input.cnpjType;
  }
  
  const pipeline = await PipelineModel.findById(input.pipelineId);
  if (!pipeline) throw new AppError('Pipeline inválido', StatusCodes.BAD_REQUEST);
  
  const stage = await StageModel.findById(input.stageId);
  if (!stage) throw new AppError('Stage inválido', StatusCodes.BAD_REQUEST);

  const rank = input.rank || '0|hzzzzz:';
  
  // Distribuição
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

  // Log de Atividade de Criação
  const creatorId = user?.sub;
  const userDoc = creatorId ? await UserModel.findById(creatorId) : null;
  const userName = userDoc?.name || 'Sistema';
  const finalUserId = creatorId || SYSTEM_ID;

  await ActivityService.createActivity({
    leadId: lead._id.toString(),
    tipo: 'lead_criado' as any,
    descricao: `Lead criado por ${userName}`,
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

  const lead = await LeadModel.findByIdAndUpdate(
      id, 
      { ...input, updatedBy: user?.sub }, 
      { new: true }
    )
    .populate('owners', 'name email')
    .populate('owner', 'name email');
  
  // Preparação para logs
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
  await ActivityService.createActivity({
    leadId: id,
    tipo: 'lead_atualizado' as any,
    descricao: `${userName} atualizou os dados do lead`,
    userId: finalUserId,
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

// --- FUNÇÃO CORRIGIDA PARA ACEITAR TIPOS ANTIGOS E NOVOS ---
export async function addActivity(leadId: string, type: string, payload: any, userId?: string) {
  const lead = await LeadModel.findById(leadId);
  if (!lead) throw new AppError('Lead não encontrado', StatusCodes.NOT_FOUND);
  
  const descricao = payload.description || payload.descricao || 'Nova atividade registrada';

  // 1. Garante que temos um ID válido para o Mongo (Hex 24 chars)
  // Se não vier userId (ex: Webhook), usa o ID zerado do sistema.
  const finalUserId = (userId && mongoose.Types.ObjectId.isValid(userId)) ? userId : SYSTEM_ID;
  
  let finalUserName = 'Sistema';

  // Se for um usuário real, tenta pegar o nome. Se não, fica como Sistema.
  if (userId && userId !== SYSTEM_ID && mongoose.Types.ObjectId.isValid(userId)) {
    try {
      const user = await UserModel.findById(userId);
      if (user) finalUserName = user.name;
    } catch (err) {
      // Falha silenciosa, mantém 'Sistema'
    }
  }

  // 2. Mapeamento de Compatibilidade (Strings antigas -> Tipos novos)
  let novoTipo = type;
  
  if (type === 'Sistema' || type === 'Alteração') {
    novoTipo = 'lead_atualizado'; 
  }

  // 3. 'as any' resolve o erro do TypeScript que reclamava dos tipos
  return ActivityService.createActivity({
    leadId,
    tipo: novoTipo as any, 
    descricao,
    userId: finalUserId,
    userName: finalUserName,
    metadata: payload
  });
}