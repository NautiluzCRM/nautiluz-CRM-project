import { StatusCodes } from 'http-status-codes';
export class AppError extends Error {
    constructor(message, statusCode = StatusCodes.BAD_REQUEST, details) {
        super(message);
        this.statusCode = statusCode;
        this.details = details;
    }
}
export const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};
