import { PipelineModel } from './pipeline.model.js';
import { StageModel } from './stage.model.js';
export function listPipelines() {
    return PipelineModel.find();
}
export function createPipeline(input) {
    return PipelineModel.create(input);
}
export function updatePipeline(id, input) {
    return PipelineModel.findByIdAndUpdate(id, input, { new: true });
}
export async function deletePipeline(id) {
    await StageModel.deleteMany({ pipelineId: id });
    return PipelineModel.findByIdAndDelete(id);
}
export function listStages(pipelineId) {
    return StageModel.find({ pipelineId }).sort({ order: 1 });
}
export function createStage(pipelineId, input) {
    return StageModel.create({ pipelineId, ...input });
}
export function updateStage(id, input) {
    return StageModel.findByIdAndUpdate(id, input, { new: true });
}
export function deleteStage(id) {
    return StageModel.findByIdAndDelete(id);
}
