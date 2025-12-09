import { Router } from 'express';
import { authenticate } from '../../rbac/rbac.middleware.js';
import {
  createFilterHandler,
  deleteFilterHandler,
  listFiltersHandler,
  updateFilterHandler
} from './filters.controller.js';

const router = Router();
router.use(authenticate);

router.get('/', listFiltersHandler);
router.post('/', createFilterHandler);
router.patch('/:id', updateFilterHandler);
router.delete('/:id', deleteFilterHandler);

export default router;
