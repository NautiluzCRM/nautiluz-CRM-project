import mongoose, { Schema, Types } from 'mongoose';

export interface Activity {
  leadId: Types.ObjectId;
  type: string;
  payload?: any;
  userId?: Types.ObjectId;
  ip?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const activitySchema = new Schema<Activity>({
  leadId: { type: Schema.Types.ObjectId, ref: 'Lead', required: true, index: true },
  type: { type: String, required: true },
  payload: Schema.Types.Mixed,
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  ip: String
}, { timestamps: true });

export const ActivityModel = mongoose.model<Activity>('Activity', activitySchema);
