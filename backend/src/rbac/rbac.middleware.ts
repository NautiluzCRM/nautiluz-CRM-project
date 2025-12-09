import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../auth/jwt.js';
import { AppError } from '../common/http.js';
import { StatusCodes } from 'http-status-codes';

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    throw new AppError('Unauthenticated', StatusCodes.UNAUTHORIZED);
  }
  const token = header.slice(7);
  const payload = verifyAccessToken(token);
  (req as any).user = payload;
  next();
}
