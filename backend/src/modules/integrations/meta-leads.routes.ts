import { Router } from 'express';
import { metaWebhookHandler } from './meta-leads.controller.js';

const router = Router();

router.post('/webhook', metaWebhookHandler);

export default router;
