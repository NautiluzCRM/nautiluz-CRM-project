import { asyncHandler } from '../../common/http.js';
import { z } from 'zod';
import { moveCard } from './kanban.service.js';
const moveSchema = z.object({
    leadId: z.string(),
    toStageId: z.string(),
    beforeId: z.string().optional(),
    afterId: z.string().optional()
});
export const moveCardHandler = asyncHandler(async (req, res) => {
    const body = moveSchema.parse(req.body);
    const lead = await moveCard({ ...body, userId: req.user?.sub });
    res.json(lead);
});
