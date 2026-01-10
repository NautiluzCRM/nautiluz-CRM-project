import { UserModel } from './user.model.js';
import { hashPassword, verifyPassword } from '../../auth/password.js';
import { sendPasswordResetEmail } from '../../auth/email.service.js';
import { PasswordResetModel } from '../../auth/password-reset.model.js';
import { env } from '../../config/env.js';
import crypto from 'crypto';

export function listUsers() {
  return UserModel.find();
}

export function getUser(id: string) {
  return UserModel.findById(id);
}

export async function createUser(input: { name: string; email: string; password: string; role: string; active?: boolean; phone?: string; jobTitle?: string; emailSignature?: string; photoUrl?: string | null; sendResetEmail?: boolean; }) {
  const passwordHash = await hashPassword(input.password);
  
  const user = await UserModel.create({
    name: input.name,
    email: input.email,
    passwordHash,
    role: input.role,
    active: input.active ?? true,
    phone: input.phone,
    jobTitle: input.jobTitle,
    emailSignature: input.emailSignature,
    photoUrl: input.photoUrl
  });

  // Se sendResetEmail for true (padrão ao criar vendedor), envia email de redefinição
  if (input.sendResetEmail !== false) {
    try {
      // Gera token de redefinição
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

      await PasswordResetModel.create({
        userId: user._id,
        token,
        expiresAt
      });

      // Monta link de definição de senha
      const resetLink = `${env.FRONTEND_URL}/redefinir-senha?token=${token}`;

      // Envia email
      await sendPasswordResetEmail({
        to: user.email,
        userName: user.name,
        resetLink,
        isNewUser: true
      });
    } catch (emailError) {
      console.error('Erro ao enviar email de boas-vindas:', emailError);
      // Não falha a criação do usuário se o email falhar
    }
  }

  return user;
}

export async function updateUser(id: string, input: Partial<{ 
  name: string; 
  email: string; 
  password: string; 
  currentPassword?: string; 
  role: string; 
  active: boolean; 
  phone: string; 
  jobTitle: string; 
  emailSignature: string; 
  photoUrl: string | null;
  notificationPreferences: {
    email?: boolean;
    sla?: boolean;
    sms?: boolean;
  };
  preferences: {
    darkMode?: boolean;
    autoSave?: boolean;
  };
}>) {
  const update: any = { ...input };

  delete update.currentPassword;
  delete update.password;

  if (input.password) {
    const user = await UserModel.findById(id).select('+passwordHash');
    
    if (!user) throw new Error('Usuário não encontrado');

    if (!input.currentPassword) {
      throw new Error('Para alterar a senha, informe a senha atual.');
    }

    const isMatch = await verifyPassword(user.passwordHash, input.currentPassword);

    if (!isMatch) {
      throw new Error('A senha atual está incorreta.');
    }

    update.passwordHash = await hashPassword(input.password);
  }

  return UserModel.findByIdAndUpdate(id, update, { new: true });
}

export function deleteUser(id: string) {
  return UserModel.findByIdAndDelete(id);
}
