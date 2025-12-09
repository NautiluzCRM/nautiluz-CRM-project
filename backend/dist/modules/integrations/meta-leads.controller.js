import { asyncHandler } from '../../common/http.js';
import { ingestMetaPayload } from './meta-leads.service.js';
export const metaWebhookHandler = asyncHandler(async (req, res) => {
    await ingestMetaPayload(req.body);
    res.status(202).json({ received: true });
});
