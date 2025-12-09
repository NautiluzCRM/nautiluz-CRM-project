import { LeadModel } from './lead.model.js';
import { ActivityModel } from './activity.model.js';
import { PipelineModel } from '../pipelines/pipeline.model.js';
import { StageModel } from '../pipelines/stage.model.js';
import { AppError } from '../../common/http.js';
import { StatusCodes } from 'http-status-codes';
import { randomUUID } from 'crypto';
export function listLeads(filter = {}) {
    return LeadModel.find(filter).sort({ createdAt: -1 });
}
export function getLead(id) {
    return LeadModel.findById(id);
}
export async function createLead(input, userId) {
    const pipeline = await PipelineModel.findById(input.pipelineId);
    if (!pipeline)
        throw new AppError('Pipeline inválido', StatusCodes.BAD_REQUEST);
    const stage = await StageModel.findById(input.stageId);
    if (!stage)
        throw new AppError('Stage inválido', StatusCodes.BAD_REQUEST);
    const rank = input.rank || randomUUID();
    const lead = await LeadModel.create({ ...input, rank, createdBy: userId });
    await ActivityModel.create({ leadId: lead._id, type: 'create', payload: input, userId });
    return lead;
}
export async function updateLead(id, input, userId) {
    const lead = await LeadModel.findByIdAndUpdate(id, { ...input, updatedBy: userId }, { new: true });
    if (!lead)
        throw new AppError('Lead não encontrado', StatusCodes.NOT_FOUND);
    await ActivityModel.create({ leadId: lead._id, type: 'update', payload: input, userId });
    return lead;
}
export function deleteLead(id) {
    return LeadModel.findByIdAndDelete(id);
}
export async function addActivity(leadId, type, payload, userId) {
    const lead = await LeadModel.findById(leadId);
    if (!lead)
        throw new AppError('Lead não encontrado', StatusCodes.NOT_FOUND);
    return ActivityModel.create({ leadId, type, payload, userId });
}
