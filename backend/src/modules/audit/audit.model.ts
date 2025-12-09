import mongoose, { Schema, Types } from 'mongoose';

export interface Audit {
  action: string;
  userId?: Types.ObjectId;
  resource: string;
  resourceId?: string;
  payload?: any;
}

const auditSchema = new Schema<Audit>({
  action: { type: String, required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  resource: { type: String, required: true },
  resourceId: { type: String },
  payload: Schema.Types.Mixed
}, { timestamps: true });

export const AuditModel = mongoose.model<Audit>('Audit', auditSchema);
