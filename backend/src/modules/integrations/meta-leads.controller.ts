import { Request, Response } from 'express';
import { asyncHandler } from '../../common/http.js';
import { ingestMetaPayload } from './meta-leads.service.js';

export const metaWebhookHandler = asyncHandler(async (req: Request, res: Response) => {
  await ingestMetaPayload(req.body);
  res.status(202).json({ received: true });
});
