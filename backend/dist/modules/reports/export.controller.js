import { asyncHandler } from '../../common/http.js';
import { exportLeadsToXlsx } from './export.service.js';
export const exportXlsxHandler = asyncHandler(async (req, res) => {
    const result = await exportLeadsToXlsx(req.body || {});
    res.json(result);
});
