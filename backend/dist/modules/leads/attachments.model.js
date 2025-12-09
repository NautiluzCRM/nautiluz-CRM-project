import mongoose, { Schema } from 'mongoose';
const attachmentSchema = new Schema({
    leadId: { type: Schema.Types.ObjectId, ref: 'Lead', required: true, index: true },
    filename: { type: String, required: true },
    url: { type: String, required: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });
export const AttachmentModel = mongoose.model('Attachment', attachmentSchema);
