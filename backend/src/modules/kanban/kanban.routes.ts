import { Router } from 'express';
import { moveCardHandler } from './kanban.controller.js';
import { authenticate } from '../../rbac/rbac.middleware.js';

const router = Router();
router.use(authenticate);

router.post('/move', moveCardHandler);

export default router;
