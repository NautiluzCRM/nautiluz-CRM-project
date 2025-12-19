import { UserModel } from './user.model.js';
import { hashPassword, verifyPassword } from '../../auth/password.js';

export function listUsers() {
  return UserModel.find();
}

export function getUser(id: string) {
  return UserModel.findById(id);
}

export async function createUser(input: { name: string; email: string; password: string; role: string; active?: boolean; phone?: string; jobTitle?: string; emailSignature?: string; photoUrl?: string | null; }) {
  const passwordHash = await hashPassword(input.password);
  
  return UserModel.create({
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
}

export async function updateUser(id: string, input: Partial<{ name: string; email: string; password: string; currentPassword?: string; role: string; active: boolean; phone: string; jobTitle: string; emailSignature: string; photoUrl: string | null; }>) {
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
