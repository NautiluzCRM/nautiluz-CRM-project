import { PipelineModel } from './pipeline.model.js';
import { StageModel } from './stage.model.js';
import { LeadModel } from '../leads/lead.model.js';

export function listPipelines() {
  return PipelineModel.find();
}

export function createPipeline(input: { name: string; key: string; description?: string }) {
  return PipelineModel.create(input);
}

export function updatePipeline(id: string, input: Partial<{ name: string; key: string; description: string }>) {
  return PipelineModel.findByIdAndUpdate(id, input, { new: true });
}

export async function deletePipeline(id: string) {
  await StageModel.deleteMany({ pipelineId: id });
  return PipelineModel.findByIdAndDelete(id);
}

export function listStages(pipelineId: string) {
  return StageModel.find({ pipelineId }).sort({ order: 1 });
}

export function createStage(pipelineId: string, input: { name: string; order: number; key: string; color?: string; sla?: number; columnTag?: string }) {
  return StageModel.create({ pipelineId, ...input });
}

export function updateStage(id: string, input: Partial<{ name: string; order: number; key: string; color?: string; sla?: number; columnTag?: string }>) {
  return StageModel.findByIdAndUpdate(id, input, { new: true });
}

export async function deleteStage(id: string) {
  // 1. Verifica se tem leads nessa etapa
  const leadsCount = await LeadModel.countDocuments({ stageId: id });
  
  if (leadsCount > 0) {
    throw new Error(`Não é possível excluir: existem ${leadsCount} leads nesta etapa.`);
  }

  // 2. Se não tiver, pode excluir
  return StageModel.findByIdAndDelete(id);
}

export async function reorderStages(pipelineId: string, orderedIds: string[]) {
  const updates = orderedIds.map((id, index) => {
    return StageModel.updateOne(
      { _id: id, pipelineId },
      { order: index + 1 }
    );
  });
  
  await Promise.all(updates);
  return listStages(pipelineId);
}