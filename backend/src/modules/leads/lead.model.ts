import mongoose, { Schema, Types } from 'mongoose';

export interface Lead {
  name: string;
  company?: string;
  phone?: string;
  email?: string;
  hasCnpj?: boolean;
  cnpjType?: string;
  livesCount?: number;
  ageBuckets?: number[];
  hasCurrentPlan?: boolean;
  currentPlan?: string;
  avgPrice?: number;
  preferredHospitals?: string[];
  state?: string;
  city?: string;
  origin: string;
  owner?: Types.ObjectId;
  pipelineId: Types.ObjectId;
  stageId: Types.ObjectId;
  rank: string;
  qualificationStatus?: string;
  lostReason?: string;
  notes?: string;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  lastActivityAt?: Date;
  wonAt?: Date;
  lostAt?: Date;
}

const leadSchema = new Schema<Lead>({
  name: { type: String, required: true },
  company: String,
  phone: String,
  email: { type: String, index: true },
  hasCnpj: Boolean,
  cnpjType: String,
  livesCount: Number,
  ageBuckets: [Number],
  hasCurrentPlan: Boolean,
  currentPlan: String,
  avgPrice: Number,
  preferredHospitals: [String],
  state: String,
  city: String,
  origin: { type: String, required: true },
  owner: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  pipelineId: { type: Schema.Types.ObjectId, ref: 'Pipeline', required: true, index: true },
  stageId: { type: Schema.Types.ObjectId, ref: 'Stage', required: true, index: true },
  rank: { type: String, required: true, index: true },
  qualificationStatus: String,
  lostReason: String,
  notes: String,
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  lastActivityAt: Date,
  wonAt: Date,
  lostAt: Date
}, { timestamps: true });

leadSchema.index({ pipelineId: 1, stageId: 1, rank: 1 });

export const LeadModel = mongoose.model<Lead>('Lead', leadSchema);
