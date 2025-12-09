import mongoose, { Schema } from 'mongoose';
import { roles } from '../../rbac/rbac.policies.js';
const userSchema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: roles, required: true },
    teamId: { type: String },
    photoUrl: { type: String },
    active: { type: Boolean, default: true }
}, { timestamps: true });
export const UserModel = mongoose.model('User', userSchema);
