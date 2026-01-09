import { Router } from 'express';
import authRoutes from './auth/auth.routes.js';
import userRoutes from './modules/users/user.routes.js';
import pipelineRoutes from './modules/pipelines/pipelines.routes.js';
import leadRoutes from './modules/leads/leads.routes.js';
import kanbanRoutes from './modules/kanban/kanban.routes.js';
import filterRoutes from './modules/filters/filters.routes.js';
import exportRoutes from './modules/reports/export.routes.js';
import metaRoutes from './modules/integrations/meta-leads.routes.js';
import viewRoutes from './modules/filters/views.routes.js';
import apolicesRoutes from './modules/apolices/apolices.routes.js';
import emailsRoutes from './modules/emails/emails.routes.js';
import alertsRoutes from './modules/alerts/alerts.routes.js';
import { webhookHandler } from './modules/webhooks/webhook.controller.js';

const router = Router();

// Autenticação
router.use('/auth', authRoutes);

// Recursos principais
router.use('/users', userRoutes);
router.use('/pipelines', pipelineRoutes);
router.use('/leads', leadRoutes);
router.use('/kanban', kanbanRoutes);

// Novas funcionalidades
router.use('/apolices', apolicesRoutes);
router.use('/emails', emailsRoutes);
router.use('/alerts', alertsRoutes);

// Filtros e visualizações
router.use('/filters', filterRoutes);
router.use('/views', viewRoutes);

// Exportação e relatórios
router.use('/exports', exportRoutes);

// Integrações
router.use('/integrations/meta', metaRoutes);
router.post('/webhooks/leads', webhookHandler);

// Facebook Webhooks
//router.get('/webhooks/facebook', verifyWebhook);
router.post('/webhooks/facebook', webhookHandler);

export default router;
