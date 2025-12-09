import mongoose, { Schema } from 'mongoose';
const viewSchema = new Schema({
    name: { type: String, required: true },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    filters: { type: Schema.Types.Mixed, required: true },
    isShared: { type: Boolean, default: false }
}, { timestamps: true });
export const ViewModel = mongoose.model('View', viewSchema);
