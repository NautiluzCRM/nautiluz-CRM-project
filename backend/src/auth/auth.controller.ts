import { Request, Response } from 'express';
import { login, refresh, forgotPassword, resetPassword, validateResetToken } from './auth.service.js';
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

const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email()
  })
});

const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(1),
    password: z.string().min(6)
  })
});

const validateTokenSchema = z.object({
  query: z.object({
    token: z.string().min(1)
  })
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

export const forgotPasswordHandler = asyncHandler(async (req: Request, res: Response) => {
  const parsed = forgotPasswordSchema.parse({ body: req.body });
  const result = await forgotPassword(parsed.body.email);
  res.json(result);
});

export const resetPasswordHandler = asyncHandler(async (req: Request, res: Response) => {
  const parsed = resetPasswordSchema.parse({ body: req.body });
  const result = await resetPassword(parsed.body.token, parsed.body.password);
  res.json(result);
});

export const validateResetTokenHandler = asyncHandler(async (req: Request, res: Response) => {
  const parsed = validateTokenSchema.parse({ query: req.query });
  const result = await validateResetToken(parsed.query.token);
  res.json(result);
});
