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
router.use(requireRole(['admin']));

router.get('/', listUsersHandler);
router.post('/', createUserHandler);
router.get('/:id', getUserHandler);
router.patch('/:id', updateUserHandler);
router.delete('/:id', deleteUserHandler);

export default router;
