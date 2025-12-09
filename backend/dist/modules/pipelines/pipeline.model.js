import mongoose, { Schema } from 'mongoose';
const pipelineSchema = new Schema({
    name: { type: String, required: true },
    key: { type: String, required: true, unique: true },
    description: { type: String }
}, { timestamps: true });
export const PipelineModel = mongoose.model('Pipeline', pipelineSchema);
