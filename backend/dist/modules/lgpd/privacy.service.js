import { ConsentModel } from './consent.model.js';
export function recordConsent(leadId, version, accepted) {
    return ConsentModel.create({ leadId, version, accepted });
}
