import { Request, Response, NextFunction } from 'express';
import { AppError } from '../common/http.js';
import { StatusCodes } from 'http-status-codes';

export function requireRole(roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user || !roles.includes(user.role)) {
      throw new AppError('Forbidden', StatusCodes.FORBIDDEN);
    }
    next();
  };
}
