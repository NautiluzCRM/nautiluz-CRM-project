import mongoose, { Schema, Types } from 'mongoose';

export interface View {
  name: string;
  owner: Types.ObjectId;
  filters: any;
  isShared?: boolean;
}

const viewSchema = new Schema<View>({
  name: { type: String, required: true },
  owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  filters: { type: Schema.Types.Mixed, required: true },
  isShared: { type: Boolean, default: false }
}, { timestamps: true });

export const ViewModel = mongoose.model<View>('View', viewSchema);
