import mongoose, { Schema } from 'mongoose';
import { roles } from '../../rbac/rbac.policies.js';

export interface User {
  name: string;
  email: string;
  passwordHash: string;
  role: (typeof roles)[number];
  teamId?: string;
  photoUrl?: string;
  active: boolean;
  phone?: string;
  jobTitle?: string;
  emailSignature?: string;
}

const userSchema = new Schema<User>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: roles, required: true },
  teamId: { type: String },
  photoUrl: { type: String },
  active: { type: Boolean, default: true },
  phone: { type: String },
  jobTitle: { type: String },
  emailSignature: { type: String }
}, { timestamps: true });

export const UserModel = mongoose.model<User>('User', userSchema);