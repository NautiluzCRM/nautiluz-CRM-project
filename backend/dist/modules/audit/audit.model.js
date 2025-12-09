import mongoose, { Schema } from 'mongoose';
const auditSchema = new Schema({
    action: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    resource: { type: String, required: true },
    resourceId: { type: String },
    payload: Schema.Types.Mixed
}, { timestamps: true });
export const AuditModel = mongoose.model('Audit', auditSchema);
