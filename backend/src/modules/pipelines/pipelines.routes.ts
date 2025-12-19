import { Router } from 'express';
import {
  createPipelineHandler,
  createStageHandler,
  deletePipelineHandler,
  deleteStageHandler,
  listPipelinesHandler,
  listStagesHandler,
  updatePipelineHandler,
  updateStageHandler
} from './pipelines.controller.js';
import { authenticate } from '../../rbac/rbac.middleware.js';
import { requireRole } from '../../rbac/rbac.guard.js';

const router = Router();
router.use(authenticate);

// --- ROTAS PÚBLICAS (Para todos os logados) ---
// Necessário para carregar o Kanban
router.get('/', listPipelinesHandler);
router.get('/:id/stages', listStagesHandler);

// --- ROTAS PROTEGIDAS (Apenas Admin) ---
// Configuração do sistema deve ser restrita
router.post('/', requireRole(['admin']), createPipelineHandler);
router.patch('/:id', requireRole(['admin']), updatePipelineHandler);
router.delete('/:id', requireRole(['admin']), deletePipelineHandler);

router.post('/:id/stages', requireRole(['admin']), createStageHandler);
router.patch('/stages/:id', requireRole(['admin']), updateStageHandler);
router.delete('/stages/:id', requireRole(['admin']), deleteStageHandler);

export default router;