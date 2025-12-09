import mongoose, { Schema, Types } from 'mongoose';

export interface Attachment {
  leadId: Types.ObjectId;
  filename: string;
  url: string;
  uploadedBy?: Types.ObjectId;
}

const attachmentSchema = new Schema<Attachment>({
  leadId: { type: Schema.Types.ObjectId, ref: 'Lead', required: true, index: true },
  filename: { type: String, required: true },
  url: { type: String, required: true },
  uploadedBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

export const AttachmentModel = mongoose.model<Attachment>('Attachment', attachmentSchema);
