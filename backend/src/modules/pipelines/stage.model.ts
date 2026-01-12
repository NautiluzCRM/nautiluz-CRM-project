import mongoose, { Schema, Types } from 'mongoose';

export interface Stage {
  pipelineId: Types.ObjectId;
  name: string;
  order: number;
  key: string;
  color?: string;
  sla?: number;
  wipLimit?: number;
  columnTag?: string;
  requiredFieldsOnEnter?: string[];
  requiredFieldsOnExit?: string[];
  allowedRolesToEnter?: string[];
  allowedRolesToExit?: string[];
}

const stageSchema = new Schema<Stage>({
  pipelineId: { type: Schema.Types.ObjectId, ref: 'Pipeline', required: true, index: true },
  name: { type: String, required: true },
  order: { type: Number, required: true },
  key: { type: String, required: true },
  color: { type: String, default: '#3B82F6' },
  sla: { type: Number, default: 0 },
  wipLimit: { type: Number },
  columnTag: { type: String, default: '' },
  requiredFieldsOnEnter: [{ type: String }],
  requiredFieldsOnExit: [{ type: String }],
  allowedRolesToEnter: [{ type: String }],
  allowedRolesToExit: [{ type: String }]
}, { timestamps: true });

export const StageModel = mongoose.model<Stage>('Stage', stageSchema);
