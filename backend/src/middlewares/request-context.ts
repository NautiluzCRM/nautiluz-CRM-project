import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

export function requestContext(req: Request, _res: Response, next: NextFunction) {
  (req as any).requestId = randomUUID();
  next();
}
