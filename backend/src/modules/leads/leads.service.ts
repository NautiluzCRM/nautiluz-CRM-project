import { LeadModel } from './lead.model.js';
import { ActivityModel } from './activity.model.js';
import { PipelineModel } from '../pipelines/pipeline.model.js';
import { StageModel } from '../pipelines/stage.model.js';
import { AppError } from '../../common/http.js';
import { StatusCodes } from 'http-status-codes';
import mongoose from 'mongoose';
import { ActivityService } from '../../services/activity.service.js';
import { UserModel } from '../users/user.model.js';

// Interfaces novas vindas da develop (mantenha isso)
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

  // --- 1. REGRA DE SEGURANÇA (Sua Lógica + Estrutura Nova) ---
  // Se tem usuário e ele NÃO é admin, forçamos o filtro para ver apenas os dele.
  if (user && user.role !== 'admin') {
    query.owners = user.sub;
  } 
  // Se for admin e escolheu filtrar por alguém específico, usamos o filtro.
  else if (filter.owners) {
    query.owners = filter.owners;
  }

 // --- 2. BUSCA TEXTUAL ---
  if (filter.search || filter.name) {
    const searchTerm = filter.search || filter.name;
    const regex = { $regex: searchTerm, $options: 'i' };
    // Procura em Nome, Email ou Telefone ao mesmo tempo
    query.$or = [
      { name: regex },
      { email: regex },
      { phone: regex }
    ];
  }

  // --- 3. FILTROS NOVOS (Vindos da Develop) ---
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
      endDate.setDate(endDate.getDate() + 1); // Ajuste para incluir o dia final
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

// ... resto das funções ...
export function getLead(id: string) {
  return LeadModel.findById(id)
    .populate('owners', 'name email')
    .populate('owner', 'name email');
}

export async function createLead(input: any, user?: UserAuth) {
  const pipeline = await PipelineModel.findById(input.pipelineId);
  if (!pipeline) throw new AppError('Pipeline inválido', StatusCodes.BAD_REQUEST);
  
  const stage = await StageModel.findById(input.stageId);
  if (!stage) throw new AppError('Stage inválido', StatusCodes.BAD_REQUEST);

  const rank = input.rank || '0|hzzzzz:';
  const userId = user?.sub;

  let ownersList = input.owners;
  if (!ownersList || ownersList.length === 0) {
    ownersList = userId ? [userId] : [];
  }

  const lead = await LeadModel.create({ 
    ...input, 
    owners: ownersList,
    rank, 
    createdBy: userId,
    active: true,
    createdAt: input.createdAt || new Date(),
    lastActivity: input.createdAt || new Date()
  });

  // Usar o novo ActivityService
  const userDoc = userId ? await UserModel.findById(userId) : null;
  const userName = userDoc?.name || 'Sistema';
  
  await ActivityService.createActivity({
    leadId: lead._id.toString(),
    tipo: 'lead_criado',
    descricao: `Lead criado por ${userName}`,
    userId: userId || 'sistema',
    userName: userName
  });

  // Mantém a atividade antiga para compatibilidade
  await ActivityModel.create({ 
    leadId: lead._id, 
    type: 'Sistema',        
    descricao: 'Lead criado no sistema', 
    usuario: userId || 'Sistema',
    data: input.createdAt || new Date()
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
  
  // Detectar mudanças importantes e logar atividades específicas
  const userDoc = user?.sub ? await UserModel.findById(user.sub) : null;
  const userName = userDoc?.name || 'Sistema';
  const userId = user?.sub || 'sistema';

  // Mudança de stage (mover lead no pipeline)
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

  // Mudança de responsáveis
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

  // Mudança de status de qualificação
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

  // Atividade genérica de atualização
  await ActivityService.createActivity({
    leadId: id,
    tipo: 'lead_atualizado',
    descricao: `${userName} atualizou os dados do lead`,
    userId: userId,
    userName: userName
  });
  
  // Mantém a atividade antiga para compatibilidade
  await ActivityModel.create({ 
    leadId: lead!._id, 
    type: 'Alteração', 
    descricao: 'Dados do lead atualizados', 
    payload: input, 
    usuario: user?.sub || 'Sistema',
    data: new Date()
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

export async function addActivity(leadId: string, type: string, payload: any, userId?: string) {
  const lead = await LeadModel.findById(leadId);
  if (!lead) throw new AppError('Lead não encontrado', StatusCodes.NOT_FOUND);
  
  const descricao = payload.description || payload.descricao || 'Nova atividade registrada';

  return ActivityModel.create({ 
    leadId, 
    type,       
    descricao,  
    payload, 
    usuario: userId || 'Sistema',
    data: new Date()
  });
}