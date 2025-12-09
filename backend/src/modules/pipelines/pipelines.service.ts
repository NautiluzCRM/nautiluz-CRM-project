import { PipelineModel } from './pipeline.model.js';
import { StageModel } from './stage.model.js';

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

export function createStage(pipelineId: string, input: { name: string; order: number; key: string }) {
  return StageModel.create({ pipelineId, ...input });
}

export function updateStage(id: string, input: Partial<{ name: string; order: number; key: string }>) {
  return StageModel.findByIdAndUpdate(id, input, { new: true });
}

export function deleteStage(id: string) {
  return StageModel.findByIdAndDelete(id);
}
