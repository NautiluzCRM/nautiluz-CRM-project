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
router.use(requireRole(['admin']));

router.get('/', listPipelinesHandler);
router.post('/', createPipelineHandler);
router.patch('/:id', updatePipelineHandler);
router.delete('/:id', deletePipelineHandler);
router.get('/:id/stages', listStagesHandler);
router.post('/:id/stages', createStageHandler);
router.patch('/stages/:id', updateStageHandler);
router.delete('/stages/:id', deleteStageHandler);

export default router;
