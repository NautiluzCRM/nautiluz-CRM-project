import { randomUUID } from 'crypto';
export function requestContext(req, _res, next) {
    req.requestId = randomUUID();
    next();
}
