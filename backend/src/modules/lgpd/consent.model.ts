import mongoose, { Schema, Types } from 'mongoose';

export interface Consent {
  leadId: Types.ObjectId;
  accepted: boolean;
  acceptedAt: Date;
  version: string;
}

const consentSchema = new Schema<Consent>({
  leadId: { type: Schema.Types.ObjectId, ref: 'Lead', required: true },
  accepted: { type: Boolean, required: true },
  acceptedAt: { type: Date, default: Date.now },
  version: { type: String, required: true }
});

export const ConsentModel = mongoose.model<Consent>('Consent', consentSchema);
