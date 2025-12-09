import { verifyAccessToken } from '../auth/jwt.js';
import { AppError } from '../common/http.js';
import { StatusCodes } from 'http-status-codes';
export function authenticate(req, _res, next) {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
        throw new AppError('Unauthenticated', StatusCodes.UNAUTHORIZED);
    }
    const token = header.slice(7);
    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
}
