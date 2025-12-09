import { AuditModel } from './audit.model.js';
export function logAudit(entry) {
    return AuditModel.create(entry);
}
