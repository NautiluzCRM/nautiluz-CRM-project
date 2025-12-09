import jwt, { Secret } from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from '../common/http.js';
import { StatusCodes } from 'http-status-codes';

export interface JwtPayload {
  sub: string;
  role: string;
}

export function signAccessToken(payload: JwtPayload) {
  return jwt.sign(payload, env.JWT_SECRET as Secret, { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] });
}

export function signRefreshToken(payload: JwtPayload) {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET as Secret, { expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn'] });
}

export function verifyAccessToken(token: string) {
  try {
    return jwt.verify(token, env.JWT_SECRET as Secret) as JwtPayload;
  } catch {
    throw new AppError('Token inválido', StatusCodes.UNAUTHORIZED);
  }
}

export function verifyRefreshToken(token: string) {
  try {
    return jwt.verify(token, env.JWT_REFRESH_SECRET as Secret) as JwtPayload;
  } catch {
    throw new AppError('Refresh token inválido', StatusCodes.UNAUTHORIZED);
  }
}
