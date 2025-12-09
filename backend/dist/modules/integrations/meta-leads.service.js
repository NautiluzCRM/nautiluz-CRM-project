import { metaWebhookSchema } from './meta.validation.js';
import { createLead } from '../leads/leads.service.js';
export async function ingestMetaPayload(body) {
    const parsed = metaWebhookSchema.parse(body);
    const name = parsed.field_data?.find((f) => f.name === 'full_name')?.values[0] ?? 'Lead Instagram';
    const email = parsed.field_data?.find((f) => f.name === 'email')?.values[0];
    const phone = parsed.field_data?.find((f) => f.name === 'phone_number')?.values[0];
    const lead = await createLead({
        name,
        email,
        phone,
        origin: 'Instagram',
        pipelineId: parsed.form_id ?? '',
        stageId: parsed.form_id ?? ''
    });
    return lead;
}
