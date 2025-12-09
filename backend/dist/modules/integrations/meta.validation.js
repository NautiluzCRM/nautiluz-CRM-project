import { z } from 'zod';
export const metaWebhookSchema = z.object({
    leadgen_id: z.string(),
    form_id: z.string().optional(),
    created_time: z.string().optional(),
    field_data: z.array(z.object({ name: z.string(), values: z.array(z.string()) })).optional()
});
