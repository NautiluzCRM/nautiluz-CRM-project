import mongoose, { Schema } from 'mongoose';
const stageSchema = new Schema({
    pipelineId: { type: Schema.Types.ObjectId, ref: 'Pipeline', required: true, index: true },
    name: { type: String, required: true },
    order: { type: Number, required: true },
    key: { type: String, required: true },
    wipLimit: { type: Number },
    requiredFieldsOnEnter: [{ type: String }],
    requiredFieldsOnExit: [{ type: String }],
    allowedRolesToEnter: [{ type: String }],
    allowedRolesToExit: [{ type: String }]
}, { timestamps: true });
export const StageModel = mongoose.model('Stage', stageSchema);
