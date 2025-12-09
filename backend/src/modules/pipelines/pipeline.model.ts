import mongoose, { Schema } from 'mongoose';

export interface Pipeline {
  name: string;
  key: string;
  description?: string;
}

const pipelineSchema = new Schema<Pipeline>({
  name: { type: String, required: true },
  key: { type: String, required: true, unique: true },
  description: { type: String }
}, { timestamps: true });

export const PipelineModel = mongoose.model<Pipeline>('Pipeline', pipelineSchema);
