import { Router } from 'express';
import * as alertsController from './alerts.controller.js';
import { authenticate, requirePermission } from '../../rbac/rbac.middleware.js';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authenticate);

/**
 * GET /api/alerts
 * Lista alertas do usuário atual
 * Permissão: viewAlerts (admin, financeiro, vendedor)
 */
router.get('/', requirePermission('viewAlerts'), alertsController.listAlerts);

/**
 * GET /api/alerts/count
 * Conta alertas não lidos
 * Permissão: viewAlerts (admin, financeiro, vendedor)
 */
router.get('/count', requirePermission('viewAlerts'), alertsController.countUnread);

/**
 * POST /api/alerts/mark-all-read
 * Marca todos os alertas como lidos
 * Permissão: viewAlerts (admin, financeiro, vendedor)
 */
router.post('/mark-all-read', requirePermission('viewAlerts'), alertsController.markAllAsRead);

/**
 * POST /api/alerts/generate/apolices
 * Gera alertas de apólices próximas do vencimento (admin/cron)
 * Permissão: manageAlerts (admin, financeiro)
 */
router.post('/generate/apolices', requirePermission('manageAlerts'), alertsController.generateApoliceAlerts);

/**
 * POST /api/alerts/generate/leads
 * Gera alertas de leads que precisam de contato (admin/cron)
 * Permissão: manageAlerts (admin, financeiro)
 */
router.post('/generate/leads', requirePermission('manageAlerts'), alertsController.generateLeadAlerts);

/**
 * POST /api/alerts/cleanup
 * Limpa alertas antigos (admin)
 * Permissão: manageAlerts (admin, financeiro)
 */
router.post('/cleanup', requirePermission('manageAlerts'), alertsController.cleanupAlerts);

/**
 * GET /api/alerts/:id
 * Obtém um alerta por ID
 * Permissão: viewAlerts (admin, financeiro, vendedor)
 */
router.get('/:id', requirePermission('viewAlerts'), alertsController.getAlert);

/**
 * PATCH /api/alerts/:id/read
 * Marca alerta como lido
 * Permissão: viewAlerts (admin, financeiro, vendedor)
 */
router.patch('/:id/read', requirePermission('viewAlerts'), alertsController.markAsRead);

/**
 * PATCH /api/alerts/:id/resolve
 * Marca alerta como resolvido
 * Permissão: viewAlerts (admin, financeiro, vendedor)
 */
router.patch('/:id/resolve', requirePermission('viewAlerts'), alertsController.markAsResolved);

/**
 * PATCH /api/alerts/:id/ignore
 * Ignora um alerta
 * Permissão: viewAlerts (admin, financeiro, vendedor)
 */
router.patch('/:id/ignore', requirePermission('viewAlerts'), alertsController.ignoreAlert);

export default router;
