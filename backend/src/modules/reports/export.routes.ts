import { Router } from 'express';
import { authenticate } from '../../rbac/rbac.middleware.js';
import { exportXlsxHandler } from './export.controller.js';

const router = Router();
router.use(authenticate);

router.post('/xlsx', exportXlsxHandler);

export default router;
