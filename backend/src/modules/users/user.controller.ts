import { Request, Response } from 'express';
import { asyncHandler } from '../../common/http.js';
import { z } from 'zod';
import { createUser, deleteUser, getUser, listUsers, updateUser } from './user.service.js';

const userSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  password: z.string().min(6),
  currentPassword: z.string().optional(),
  role: z.string(),
  active: z.boolean().optional(),
  phone: z.string().optional(),
  jobTitle: z.string().optional(),
  emailSignature: z.string().optional(),
  photoUrl: z.string().optional().nullable()
});

export const listUsersHandler = asyncHandler(async (_req: Request, res: Response) => {
  const users = await listUsers();
  res.json(users);
});

export const createUserHandler = asyncHandler(async (req: Request, res: Response) => {
  const body = userSchema.parse(req.body);
  const user = await createUser(body);
  res.status(201).json(user);
});

export const getUserHandler = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = await getUser(id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
});

export const updateUserHandler = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const currentUser = (req as any).user;
  const body = userSchema.partial().parse(req.body);

  if (body.password && !body.currentPassword) {
    return res.status(400).json({ message: "Para alterar a senha, informe a senha atual." });
  }

  if (currentUser?.role !== 'admin') {
    if (body.jobTitle) delete body.jobTitle;
    if (body.email) delete body.email;
  }

  try {
    const user = await updateUser(id, body);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error: any) {
    if (error.message === 'A senha atual está incorreta.') {
      return res.status(400).json({ message: error.message });
    }
    throw error;
  }
});

export const deleteUserHandler = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = await deleteUser(id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
});
