import { ConsentModel } from './consent.model.js';

export function recordConsent(leadId: string, version: string, accepted: boolean) {
  return ConsentModel.create({ leadId, version, accepted });
}
