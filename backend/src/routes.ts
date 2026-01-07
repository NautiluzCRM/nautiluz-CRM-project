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
import notificationsRoutes from './modules/notifications/notifications.routes.js';
import { webhookHandler } from './modules/webhooks/webhook.controller.js';
import { ActivityController } from './controllers/Activity.controller.js';
import { NoteController } from './controllers/Note.controller.js';
import { authenticate } from './rbac/rbac.middleware.js';

const router = Router();

// Autenticação
router.use('/auth', authRoutes);

// Atividades e Notas (DEVE VIR ANTES DE /leads para evitar conflito de rotas)
router.get('/leads/:leadId/activities', authenticate, ActivityController.getLeadActivities);
router.get('/leads/:leadId/notes', authenticate, NoteController.getLeadNotes);
router.post('/leads/:leadId/notes', authenticate, NoteController.createNote);
router.get('/activities/recent', authenticate, ActivityController.getRecentActivities);
router.put('/notes/:noteId', authenticate, NoteController.updateNote);
router.delete('/notes/:noteId', authenticate, NoteController.deleteNote);

// Recursos principais
router.use('/users', userRoutes);
router.use('/pipelines', pipelineRoutes);
router.use('/leads', leadRoutes);
router.use('/kanban', kanbanRoutes);

// Novas funcionalidades
router.use('/apolices', apolicesRoutes);
router.use('/emails', emailsRoutes);
router.use('/alerts', alertsRoutes);
router.use('/notifications', notificationsRoutes);

// Filtros e visualizações
router.use('/filters', filterRoutes);
router.use('/views', viewRoutes);

// Exportação e relatórios
router.use('/exports', exportRoutes);

// Integrações
router.use('/integrations/meta', metaRoutes);
router.post('/webhooks/leads', webhookHandler);

export default router;
