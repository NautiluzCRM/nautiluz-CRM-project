import { Router } from 'express';
import {
  createUserHandler,
  deleteUserHandler,
  getUserHandler,
  listUsersHandler,
  updateUserHandler,
  getSellersStatsHandler,
  uploadPhotoHandler,
  removePhotoHandler
} from './user.controller.js';
import { authenticate } from '../../rbac/rbac.middleware.js';
import { requireRole } from '../../rbac/rbac.guard.js';

const router = Router();

router.use(authenticate);

// Estatísticas de vendedores - APENAS ADMIN
router.get('/sellers/stats', requireRole(['admin']), getSellersStatsHandler);

// Listagem liberada para popular selects/dropdowns
router.get('/', listUsersHandler);

// Gestão de usuários continua restrita a Admin
router.post('/', requireRole(['admin']), createUserHandler);
router.delete('/:id', requireRole(['admin']), deleteUserHandler);

// Upload e remoção de foto (próprio usuário ou admin)
router.post('/:id/photo', uploadPhotoHandler);
router.delete('/:id/photo', removePhotoHandler);

// Ver/Editar perfil específico (pode refinar depois se usuário pode editar a si mesmo)
router.get('/:id', getUserHandler);
router.patch('/:id', updateUserHandler);

export default router;