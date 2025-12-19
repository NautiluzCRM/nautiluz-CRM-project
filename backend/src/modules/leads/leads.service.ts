import { LeadModel } from './lead.model.js';
import { ActivityModel } from './activity.model.js';
import { PipelineModel } from '../pipelines/pipeline.model.js';
import { StageModel } from '../pipelines/stage.model.js';
import { AppError } from '../../common/http.js';
import { StatusCodes } from 'http-status-codes';

interface UserAuth {
  sub: string;
  role: string;
}

export async function listLeads(filter: any = {}, user?: UserAuth) {
  const query = { ...filter };
  if (filter.owners) {
     query.owners = filter.owners;
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