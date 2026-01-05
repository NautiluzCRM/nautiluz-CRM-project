import { UserModel } from '../modules/users/user.model.js';
import { PasswordResetModel } from './password-reset.model.js';
import { verifyPassword, hashPassword } from './password.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from './jwt.js';
import { sendPasswordResetEmail } from './email.service.js';
import { AppError } from '../common/http.js';
import { StatusCodes } from 'http-status-codes';
import { env } from '../config/env.js';
import crypto from 'crypto';

export async function login(email: string, password: string) {
  const user = await UserModel.findOne({ email, active: true });
  if (!user) throw new AppError('Credenciais inválidas', StatusCodes.UNAUTHORIZED);
  const ok = await verifyPassword(user.passwordHash, password);
  if (!ok) throw new AppError('Credenciais inválidas', StatusCodes.UNAUTHORIZED);
  const payload = { sub: String(user._id), role: user.role };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);
  return { accessToken, refreshToken, user };
}

export async function refresh(token: string) {
  const payload = verifyRefreshToken(token);
  const user = await UserModel.findById(payload.sub);
  if (!user || !user.active) throw new AppError('Usuário não encontrado', StatusCodes.UNAUTHORIZED);
  const accessToken = signAccessToken({ sub: payload.sub, role: payload.role });
  return { accessToken };
}

export async function forgotPassword(email: string) {
  const user = await UserModel.findOne({ email, active: true });
  
  // Sempre retorna sucesso para não expor se o email existe
  if (!user) {
    return { message: 'Se o email existir, você receberá um link de recuperação.' };
  }

  // Invalida tokens anteriores
  await PasswordResetModel.updateMany(
    { userId: user._id, used: false },
    { used: true }
  );

  // Gera novo token
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

  await PasswordResetModel.create({
    userId: user._id,
    token,
    expiresAt
  });

  // Monta link de recuperação
  const resetLink = `${env.FRONTEND_URL}/redefinir-senha?token=${token}`;

  // Envia email
  await sendPasswordResetEmail({
    to: user.email,
    userName: user.name,
    resetLink
  });

  return { message: 'Se o email existir, você receberá um link de recuperação.' };
}

export async function resetPassword(token: string, newPassword: string) {
  const resetRecord = await PasswordResetModel.findOne({
    token,
    used: false,
    expiresAt: { $gt: new Date() }
  });

  if (!resetRecord) {
    throw new AppError('Token inválido ou expirado', StatusCodes.BAD_REQUEST);
  }

  const user = await UserModel.findById(resetRecord.userId);
  if (!user || !user.active) {
    throw new AppError('Usuário não encontrado', StatusCodes.NOT_FOUND);
  }

  // Atualiza senha
  const passwordHash = await hashPassword(newPassword);
  await UserModel.updateOne({ _id: user._id }, { passwordHash });

  // Marca token como usado
  await PasswordResetModel.updateOne({ _id: resetRecord._id }, { used: true });

  return { message: 'Senha redefinida com sucesso!' };
}

export async function validateResetToken(token: string) {
  const resetRecord = await PasswordResetModel.findOne({
    token,
    used: false,
    expiresAt: { $gt: new Date() }
  });

  if (!resetRecord) {
    throw new AppError('Token inválido ou expirado', StatusCodes.BAD_REQUEST);
  }

  return { valid: true };
}
