import { asyncHandler } from '../../common/http.js';
import { z } from 'zod';
import { createUser, deleteUser, getUser, listUsers, updateUser } from './user.service.js';
const userSchema = z.object({
    name: z.string(),
    email: z.string().email(),
    password: z.string().min(6),
    role: z.string(),
    active: z.boolean().optional()
});
export const listUsersHandler = asyncHandler(async (_req, res) => {
    const users = await listUsers();
    res.json(users);
});
export const createUserHandler = asyncHandler(async (req, res) => {
    const body = userSchema.parse(req.body);
    const user = await createUser(body);
    res.status(201).json(user);
});
export const getUserHandler = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const user = await getUser(id);
    if (!user)
        return res.status(404).json({ message: 'User not found' });
    res.json(user);
});
export const updateUserHandler = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const body = userSchema.partial().parse(req.body);
    const user = await updateUser(id, body);
    if (!user)
        return res.status(404).json({ message: 'User not found' });
    res.json(user);
});
export const deleteUserHandler = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const user = await deleteUser(id);
    if (!user)
        return res.status(404).json({ message: 'User not found' });
    res.json(user);
});
