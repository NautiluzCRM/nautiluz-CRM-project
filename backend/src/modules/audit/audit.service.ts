import { AuditModel } from './audit.model.js';

export function logAudit(entry: { action: string; userId?: string; resource: string; resourceId?: string; payload?: any }) {
  return AuditModel.create(entry);
}
