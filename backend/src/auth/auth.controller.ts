import { Request, Response } from 'express';
import { login, refresh } from './auth.service.js';
import { asyncHandler } from '../common/http.js';
import { z } from 'zod';

const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(6),
    remember: z.boolean().optional()
  })
});

const refreshSchema = z.object({
  body: z.object({ token: z.string() })
});

export const loginHandler = asyncHandler(async (req: Request, res: Response) => {
  const parsed = loginSchema.parse({ body: req.body });
  const { accessToken, refreshToken, user } = await login(parsed.body.email, parsed.body.password);
  res.json({ accessToken, refreshToken, user });
});

export const refreshHandler = asyncHandler(async (req: Request, res: Response) => {
  const parsed = refreshSchema.parse({ body: req.body });
  const result = await refresh(parsed.body.token);
  res.json(result);
});
