import { Router } from 'express';
import {
  createUserHandler,
  deleteUserHandler,
  getUserHandler,
  listUsersHandler,
  updateUserHandler
} from './user.controller.js';
import { authenticate } from '../../rbac/rbac.middleware.js';
import { requireRole } from '../../rbac/rbac.guard.js';

const router = Router();

router.use(authenticate);

router.get('/', requireRole(['admin']), listUsersHandler);
router.post('/', requireRole(['admin']), createUserHandler);
router.delete('/:id', requireRole(['admin']), deleteUserHandler);

router.get('/:id', getUserHandler);
router.patch('/:id', updateUserHandler);

export default router;