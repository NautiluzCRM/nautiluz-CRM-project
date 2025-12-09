import { Request, Response } from 'express';
import { asyncHandler } from '../../common/http.js';
import { exportLeadsToXlsx } from './export.service.js';

export const exportXlsxHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await exportLeadsToXlsx(req.body || {});
  res.json(result);
});
