import { Router } from 'express';
import {
  addActivityHandler,
  createLeadHandler,
  deleteLeadHandler,
  getLeadHandler,
  listLeadsHandler,
  updateLeadHandler
} from './leads.controller.js';
import { authenticate } from '../../rbac/rbac.middleware.js';

const router = Router();
router.use(authenticate);

router.get('/', listLeadsHandler);
router.post('/', createLeadHandler);
router.get('/:id', getLeadHandler);
router.patch('/:id', updateLeadHandler);
router.delete('/:id', deleteLeadHandler);
router.post('/:id/activities', addActivityHandler);

export default router;
