import { LeadModel } from './lead.model.js';
import { ActivityModel } from './activity.model.js';
import { PipelineModel } from '../pipelines/pipeline.model.js';
import { StageModel } from '../pipelines/stage.model.js';
import { AppError } from '../../common/http.js';
import { StatusCodes } from 'http-status-codes';
import { randomUUID } from 'crypto';

export function listLeads(filter: any = {}) {
  return LeadModel.find(filter).sort({ createdAt: -1 });
}

export function getLead(id: string) {
  return LeadModel.findById(id);
}

export async function createLead(input: any, userId?: string) {
  // 1. Validação de Integridade
  const pipeline = await PipelineModel.findById(input.pipelineId);
  if (!pipeline) throw new AppError('Pipeline inválido', StatusCodes.BAD_REQUEST);
  
  const stage = await StageModel.findById(input.stageId);
  if (!stage) throw new AppError('Stage inválido', StatusCodes.BAD_REQUEST);

  // 2. Definição do Rank
  const rank = input.rank || '0|hzzzzz:';

  // 3. Criação do Lead
  const lead = await LeadModel.create({ 
    ...input, 
    rank, 
    createdBy: userId,
    active: true,
    createdAt: input.createdAt || new Date(),
    lastActivity: input.createdAt || new Date()
  });

  // 4. Auditoria de Sistema
  // CORREÇÃO AQUI: Mudamos de 'tipo' para 'type' para satisfazer o Mongoose.
  await ActivityModel.create({ 
    leadId: lead._id, 
    type: 'Sistema',         // <--- O Banco exige 'type'
    descricao: 'Lead criado no sistema', 
    usuario: userId || 'Sistema',
    data: input.createdAt || new Date()
  });

  return lead;
}

export async function updateLead(id: string, input: any, userId?: string) {
  const lead = await LeadModel.findByIdAndUpdate(id, { ...input, updatedBy: userId }, { new: true });
  if (!lead) throw new AppError('Lead não encontrado', StatusCodes.NOT_FOUND);
  
  // MELHORIA: Adicionamos 'descricao' e 'usuario' para aparecer bonitinho na Timeline
  await ActivityModel.create({ 
    leadId: lead._id, 
    type: 'Alteração', // Ou 'update'
    descricao: 'Dados do lead atualizados', 
    payload: input, 
    usuario: userId || 'Sistema',
    data: new Date()
  });
  
  return lead;
}

export function deleteLead(id: string) {
  return LeadModel.findByIdAndDelete(id);
}

export async function addActivity(leadId: string, type: string, payload: any, userId?: string) {
  const lead = await LeadModel.findById(leadId);
  if (!lead) throw new AppError('Lead não encontrado', StatusCodes.NOT_FOUND);
  
  // Se o payload tiver uma mensagem, usa ela, senão usa um padrão
  const descricao = payload.description || payload.descricao || 'Nova atividade registrada';

  return ActivityModel.create({ 
    leadId, 
    type,       // Garante que é 'type' pro banco
    descricao,  // Garante que tem texto pra timeline
    payload, 
    usuario: userId || 'Sistema',
    data: new Date()
  });
}
