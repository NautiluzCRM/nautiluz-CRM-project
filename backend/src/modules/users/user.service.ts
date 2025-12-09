import { UserModel } from './user.model.js';
import { hashPassword } from '../../auth/password.js';

export function listUsers() {
  return UserModel.find();
}

export function getUser(id: string) {
  return UserModel.findById(id);
}

export async function createUser(input: { name: string; email: string; password: string; role: string; active?: boolean }) {
  const passwordHash = await hashPassword(input.password);
  return UserModel.create({
    name: input.name,
    email: input.email,
    passwordHash,
    role: input.role,
    active: input.active ?? true
  });
}

export async function updateUser(id: string, input: Partial<{ name: string; email: string; password: string; role: string; active: boolean }>) {
  const update: any = { ...input };
  if (input.password) {
    update.passwordHash = await hashPassword(input.password);
    delete update.password;
  }
  return UserModel.findByIdAndUpdate(id, update, { new: true });
}

export function deleteUser(id: string) {
  return UserModel.findByIdAndUpdate(id, { active: false }, { new: true });
}
