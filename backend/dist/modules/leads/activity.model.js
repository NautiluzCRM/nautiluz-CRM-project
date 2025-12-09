import mongoose, { Schema } from 'mongoose';
const activitySchema = new Schema({
    leadId: { type: Schema.Types.ObjectId, ref: 'Lead', required: true, index: true },
    type: { type: String, required: true },
    payload: Schema.Types.Mixed,
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    ip: String
}, { timestamps: true });
export const ActivityModel = mongoose.model('Activity', activitySchema);
