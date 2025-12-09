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

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/pipelines', pipelineRoutes);
router.use('/leads', leadRoutes);
router.use('/kanban', kanbanRoutes);
router.use('/filters', filterRoutes);
router.use('/views', viewRoutes);
router.use('/exports', exportRoutes);
router.use('/integrations/meta', metaRoutes);

export default router;
