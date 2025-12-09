import mongoose, { Schema } from 'mongoose';
const consentSchema = new Schema({
    leadId: { type: Schema.Types.ObjectId, ref: 'Lead', required: true },
    accepted: { type: Boolean, required: true },
    acceptedAt: { type: Date, default: Date.now },
    version: { type: String, required: true }
});
export const ConsentModel = mongoose.model('Consent', consentSchema);
