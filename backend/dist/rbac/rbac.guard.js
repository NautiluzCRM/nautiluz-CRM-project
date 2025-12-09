import { AppError } from '../common/http.js';
import { StatusCodes } from 'http-status-codes';
export function requireRole(roles) {
    return (req, _res, next) => {
        const user = req.user;
        if (!user || !roles.includes(user.role)) {
            throw new AppError('Forbidden', StatusCodes.FORBIDDEN);
        }
        next();
    };
}
