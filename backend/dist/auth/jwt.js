import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from '../common/http.js';
import { StatusCodes } from 'http-status-codes';
export function signAccessToken(payload) {
    return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
}
export function signRefreshToken(payload) {
    return jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRES_IN });
}
export function verifyAccessToken(token) {
    try {
        return jwt.verify(token, env.JWT_SECRET);
    }
    catch {
        throw new AppError('Token inválido', StatusCodes.UNAUTHORIZED);
    }
}
export function verifyRefreshToken(token) {
    try {
        return jwt.verify(token, env.JWT_REFRESH_SECRET);
    }
    catch {
        throw new AppError('Refresh token inválido', StatusCodes.UNAUTHORIZED);
    }
}
