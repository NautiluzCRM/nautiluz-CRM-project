import { Router } from 'express';
import {
  addActivityHandler,
  createLeadHandler,
  deleteLeadHandler,
  getLeadHandler,
  listLeadsHandler,
  updateLeadHandler
} from './leads.controller.js';
import { 
  exportXLSXHandler,
  exportCSVHandler,
  exportPDFHandler
} from './export.controller.js';
import { authenticate } from '../../rbac/rbac.middleware.js';

const router = Router();
router.use(authenticate);

router.get('/', listLeadsHandler);
router.post('/', createLeadHandler);

// Rotas de Exportação (ANTES das rotas dinâmicas com :id)
router.post('/export/xlsx', exportXLSXHandler);
router.post('/export/csv', exportCSVHandler);
router.post('/export/pdf', exportPDFHandler);

// Rotas dinâmicas (DEPOIS das rotas estáticas)
router.get('/:id', getLeadHandler);
router.patch('/:id', updateLeadHandler);
router.delete('/:id', deleteLeadHandler);
router.post('/:id/activities', addActivityHandler);

export default router;
