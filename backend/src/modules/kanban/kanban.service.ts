import { LeadModel } from '../leads/lead.model.js';
import { StageModel } from '../pipelines/stage.model.js';
import { AppError } from '../../common/http.js';
import { StatusCodes } from 'http-status-codes';
import { emitKanbanUpdate } from '../../common/realtime.js';
import mongoose from 'mongoose';
import { UserModel } from '../users/user.model.js';
import { calculateDueDate } from '../leads/sla.service.js';
import { ActivityService } from '../../services/activity.service.js';

// Valida se é um ObjectId válido
function isValidObjectId(id: string): boolean {
  return mongoose.Types.ObjectId.isValid(id) && 
    (new mongoose.Types.ObjectId(id)).toString() === id;
}

// Simple rank midpoint between strings
function midpoint(a: string | null, b: string | null) {
  const min = '00000';
  const max = 'zzzzz';
  if (!a && !b) return 'm0000';
  if (!a) return b ? b.slice(0, 2) + '0' : 'm0000';
  if (!b) return a.slice(0, 2) + 'z';
  return a.slice(0, 2) + 'm';
}

export async function moveCard(params: { leadId: string; toStageId: string; beforeId?: string; afterId?: string; userId?: string }) {
  // Validação de IDs
  if (!params.leadId || !isValidObjectId(params.leadId)) {
    throw new AppError('ID do lead inválido', StatusCodes.BAD_REQUEST);
  }
  if (!params.toStageId || !isValidObjectId(params.toStageId)) {
    throw new AppError('ID do stage destino inválido', StatusCodes.BAD_REQUEST);
  }

  const lead = await LeadModel.findById(params.leadId);
  if (!lead) throw new AppError('Lead não encontrado', StatusCodes.NOT_FOUND);

  // Verificação de permissão: vendedor só pode mover leads que é responsável
  if (params.userId) {
    const user = await UserModel.findById(params.userId);
    if (user && user.role === 'vendedor') {
      const owners = lead.owners || [];
      const isOwner = owners.some((ownerId: any) => ownerId.toString() === params.userId);
      if (!isOwner) {
        throw new AppError('Você só pode mover leads dos quais é responsável.', StatusCodes.FORBIDDEN);
      }
    }
  }

  const toStage = await StageModel.findById(params.toStageId);
  if (!toStage) throw new AppError('Stage destino inválido', StatusCodes.BAD_REQUEST);

  let beforeRank: string | null = null;
  let afterRank: string | null = null;

  if (params.beforeId) {
    const beforeLead = await LeadModel.findById(params.beforeId);
    beforeRank = beforeLead?.rank || null;
  }
  if (params.afterId) {
    const afterLead = await LeadModel.findById(params.afterId);
    afterRank = afterLead?.rank || null;
  }

  const newRank = midpoint(beforeRank, afterRank);

  const oldStageId = lead.stageId;
  const oldStageName = oldStageId ? (await StageModel.findById(oldStageId))?.name : 'Desconhecido';

  lead.stageId = toStage._id;
  lead.rank = newRank;
  lead.updatedBy = params.userId as any;
  
  // Calcula o SLA quando mover para uma nova stage
  if (oldStageId?.toString() !== params.toStageId) {
    await calculateDueDate(lead._id, params.toStageId);
    
    // Registra atividade de movimentação
    const userName = params.userId ? (await UserModel.findById(params.userId))?.name || 'Sistema' : 'Sistema';
    await ActivityService.createActivity({
      leadId: lead._id,
      tipo: 'lead_movido',
      descricao: `Lead movido de "${oldStageName}" para "${toStage.name}"`,
      userId: params.userId ? new mongoose.Types.ObjectId(params.userId) : lead.createdBy || new mongoose.Types.ObjectId(),
      userName,
      metadata: {
        from: oldStageName,
        to: toStage.name
      }
    });
  }
  
  try {
    // Usa validateBeforeSave: false para evitar revalidar campos obrigatórios
    // que podem estar faltando em leads antigos
    await lead.save({ validateBeforeSave: false });
  } catch (error: any) {
    // Se for erro de validação do Mongoose, lança erro mais específico
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e: any) => e.message).join(', ');
      throw new AppError(`Erro ao salvar lead: ${messages}`, StatusCodes.BAD_REQUEST);
    }
    throw error;
  }

  emitKanbanUpdate(String(lead.pipelineId), { leadId: lead._id, stageId: lead.stageId, rank: lead.rank, by: params.userId });
  return lead;
}
