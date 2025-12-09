import { UserModel } from './user.model.js';
import { hashPassword } from '../../auth/password.js';
export function listUsers() {
    return UserModel.find();
}
export function getUser(id) {
    return UserModel.findById(id);
}
export async function createUser(input) {
    const passwordHash = await hashPassword(input.password);
    return UserModel.create({
        name: input.name,
        email: input.email,
        passwordHash,
        role: input.role,
        active: input.active ?? true
    });
}
export async function updateUser(id, input) {
    const update = { ...input };
    if (input.password) {
        update.passwordHash = await hashPassword(input.password);
        delete update.password;
    }
    return UserModel.findByIdAndUpdate(id, update, { new: true });
}
export function deleteUser(id) {
    return UserModel.findByIdAndUpdate(id, { active: false }, { new: true });
}
