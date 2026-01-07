import mongoose, { Schema, Document } from 'mongoose';

export interface PasswordReset extends Document {
  userId: mongoose.Types.ObjectId;
  token: string;
  expiresAt: Date;
  used: boolean;
  createdAt: Date;
}

const passwordResetSchema = new Schema<PasswordReset>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  token: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true },
  used: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

// TTL index - remove documentos expirados automaticamente após 24h
passwordResetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const PasswordResetModel = mongoose.model<PasswordReset>('PasswordReset', passwordResetSchema);
