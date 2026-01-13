import { Router } from 'express';
import {
  listLogosHandler,
  searchLogoHandler,
  upsertLogoHandler,
  deleteLogoHandler
} from './operadora-logo.controller.js';
import { authenticate } from '../../rbac/rbac.middleware.js';

const router = Router();

// Rotas públicas (para buscar logos)
router.get('/', listLogosHandler);
router.get('/search', searchLogoHandler);

// Rotas protegidas (para gerenciar logos)
router.use(authenticate);
router.post('/', upsertLogoHandler);
router.delete('/:id', deleteLogoHandler);

export default router;
