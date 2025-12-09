import { LeadModel } from '../leads/lead.model.js';
import { StageModel } from '../pipelines/stage.model.js';
import { AppError } from '../../common/http.js';
import { StatusCodes } from 'http-status-codes';
import { emitKanbanUpdate } from '../../common/realtime.js';
// Simple rank midpoint between strings
function midpoint(a, b) {
    const min = '00000';
    const max = 'zzzzz';
    if (!a && !b)
        return 'm0000';
    if (!a)
        return b ? b.slice(0, 2) + '0' : 'm0000';
    if (!b)
        return a.slice(0, 2) + 'z';
    return a.slice(0, 2) + 'm';
}
export async function moveCard(params) {
    const lead = await LeadModel.findById(params.leadId);
    if (!lead)
        throw new AppError('Lead não encontrado', StatusCodes.NOT_FOUND);
    const toStage = await StageModel.findById(params.toStageId);
    if (!toStage)
        throw new AppError('Stage destino inválido', StatusCodes.BAD_REQUEST);
    let beforeRank = null;
    let afterRank = null;
    if (params.beforeId) {
        const beforeLead = await LeadModel.findById(params.beforeId);
        beforeRank = beforeLead?.rank || null;
    }
    if (params.afterId) {
        const afterLead = await LeadModel.findById(params.afterId);
        afterRank = afterLead?.rank || null;
    }
    const newRank = midpoint(beforeRank, afterRank);
    lead.stageId = toStage._id;
    lead.rank = newRank;
    lead.updatedBy = params.userId;
    await lead.save();
    emitKanbanUpdate(String(lead.pipelineId), { leadId: lead._id, stageId: lead.stageId, rank: lead.rank, by: params.userId });
    return lead;
}
