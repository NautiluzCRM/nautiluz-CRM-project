import { Router } from 'express';
import * as apolicesController from './apolices.controller.js';
import { authenticate, requirePermission } from '../../rbac/rbac.middleware.js';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authenticate);

/**
 * GET /api/apolices
 * Lista todas as apólices (com filtros)
 * Permissão: viewApolices (admin, financeiro)
 */
router.get('/', requirePermission('viewApolices'), apolicesController.listApolices);

/**
 * GET /api/apolices/vencendo
 * Lista apólices próximas do vencimento
 * Permissão: viewApoliceAlerts (admin, financeiro)
 */
router.get('/vencendo', requirePermission('viewApoliceAlerts'), apolicesController.getApolicesVencendo);

/**
 * GET /api/apolices/stats
 * Obtém estatísticas das apólices
 * Permissão: viewApolices (admin, financeiro)
 */
router.get('/stats', requirePermission('viewApolices'), apolicesController.getApolicesStats);

/**
 * POST /api/apolices/atualizar-status
 * Atualiza status de apólices vencidas (cron/admin)
 * Permissão: manageApolices (admin, financeiro)
 */
router.post('/atualizar-status', requirePermission('manageApolices'), apolicesController.atualizarStatusVencidas);

/**
 * GET /api/apolices/:id
 * Obtém uma apólice por ID
 * Permissão: viewApolices (admin, financeiro)
 */
router.get('/:id', requirePermission('viewApolices'), apolicesController.getApolice);

/**
 * POST /api/apolices
 * Cria uma nova apólice
 * Permissão: createApolice (admin, financeiro)
 */
router.post('/', requirePermission('createApolice'), apolicesController.createApolice);

/**
 * PUT /api/apolices/:id
 * Atualiza uma apólice
 * Permissão: editApolice (admin, financeiro)
 */
router.put('/:id', requirePermission('editApolice'), apolicesController.updateApolice);

/**
 * PATCH /api/apolices/:id
 * Atualiza parcialmente uma apólice
 * Permissão: editApolice (admin, financeiro)
 */
router.patch('/:id', requirePermission('editApolice'), apolicesController.updateApolice);

/**
 * DELETE /api/apolices/:id
 * Exclui uma apólice
 * Permissão: deleteApolice (apenas admin)
 */
router.delete('/:id', requirePermission('deleteApolice'), apolicesController.deleteApolice);

/**
 * POST /api/apolices/:id/vincular-lead
 * Vincula uma apólice a um lead
 * Permissão: editApolice (admin, financeiro)
 */
router.post('/:id/vincular-lead', requirePermission('editApolice'), apolicesController.vincularAoLead);

export default router;
