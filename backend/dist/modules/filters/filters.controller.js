import { asyncHandler } from '../../common/http.js';
import { z } from 'zod';
import { createFilter, deleteFilter, listFilters, updateFilter } from './filters.service.js';
const filterSchema = z.object({ name: z.string(), filters: z.any(), isShared: z.boolean().optional() });
export const listFiltersHandler = asyncHandler(async (req, res) => {
    const userId = req.user.sub;
    const filters = await listFilters(userId);
    res.json(filters);
});
export const createFilterHandler = asyncHandler(async (req, res) => {
    const { name, filters, isShared } = filterSchema.parse(req.body);
    const view = await createFilter(req.user.sub, { name, filters, isShared });
    res.status(201).json(view);
});
export const updateFilterHandler = asyncHandler(async (req, res) => {
    const body = filterSchema.partial().parse(req.body);
    const view = await updateFilter(req.params.id, body);
    res.json(view);
});
export const deleteFilterHandler = asyncHandler(async (req, res) => {
    await deleteFilter(req.params.id);
    res.json({ ok: true });
});
