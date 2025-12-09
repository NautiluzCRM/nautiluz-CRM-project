import { z } from 'zod';
export const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid ObjectId');
export function parseBody(schema, data) {
    const parsed = schema.safeParse(data);
    if (!parsed.success) {
        throw parsed.error;
    }
    return parsed.data;
}
