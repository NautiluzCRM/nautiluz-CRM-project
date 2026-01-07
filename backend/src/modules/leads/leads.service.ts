import { LeadModel } from './lead.model.js';
import { ActivityModel } from './activity.model.js';
import { PipelineModel } from '../pipelines/pipeline.model.js';
import { StageModel } from '../pipelines/stage.model.js';
import { AppError } from '../../common/http.js';
import { StatusCodes } from 'http-status-codes';
import { randomUUID } from 'crypto';

export async function listLeads(query: any = {}, userRole?: string, userId?: string) {
  // Criamos um filtro novo para garantir que só entra o que queremos
  const mongoFilter: any = {};

  // --- 1. REGRA DE SEGURANÇA (Permissões) ---
  if (userRole === 'vendedor' && userId) {
    // Vendedor só vê leads onde o ID dele está na lista de donos
    mongoFilter.owners = userId;
  }

  // --- 2. FILTROS DE FUNIL (Pipeline/Stage) ---
  if (query.pipelineId) {
    mongoFilter.pipelineId = query.pipelineId;
  }
  
  if (query.stageId) {
    mongoFilter.stageId = query.stageId;
  }

  // --- 3. BUSCA TEXTUAL (Search Bar) ---
  // Transforma ?search=Bruno em busca por Nome OU Email OU Telefone
  if (query.search) {
    const regex = { $regex: query.search, $options: 'i' }; // 'i' = ignora maiúscula/minúscula
    mongoFilter.$or = [
      { name: regex },
      { email: regex },
      { phone: regex }
    ];
  }

  // --- 4. EXECUÇÃO ---
  return LeadModel.find(mongoFilter)
    .sort({ createdAt: -1 })
    .populate('owners', 'name email') 
    .populate('owner', 'name email'); // Legado
}

export function getLead(id: string) {
  // ALTERAÇÃO: Adicionado .populate
  return LeadModel.findById(id)
    .populate('owners', 'name email')
    .populate('owner', 'name email');
}

export async function createLead(input: any, userId?: string) {
  const pipeline = await PipelineModel.findById(input.pipelineId);
  if (!pipeline) throw new AppError('Pipeline inválido', StatusCodes.BAD_REQUEST);
  
  const stage = await StageModel.findById(input.stageId);
  if (!stage) throw new AppError('Stage inválido', StatusCodes.BAD_REQUEST);

  const rank = input.rank || '0|hzzzzz:';

  const lead = await LeadModel.create({ 
    ...input, 
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

export async function updateLead(id: string, input: any, userId?: string) {
  // ALTERAÇÃO: Adicionado .populate no retorno para o frontend receber o nome imediatamente após editar
  const lead = await LeadModel.findByIdAndUpdate(id, { ...input, updatedBy: userId }, { new: true })
    .populate('owners', 'name email')
    .populate('owner', 'name email');

  if (!lead) throw new AppError('Lead não encontrado', StatusCodes.NOT_FOUND);
  
  await ActivityModel.create({ 
    leadId: lead._id, 
    type: 'Alteração', 
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