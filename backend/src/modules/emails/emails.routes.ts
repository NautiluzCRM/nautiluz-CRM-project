import { Router } from 'express';
import * as emailsController from './emails.controller.js';
import { authenticate, requirePermission } from '../../rbac/rbac.middleware.js';

const router = Router();

/**
 * Rotas públicas (para tracking)
 */
// GET /api/emails/track/open/:messageId - Tracking de abertura (pixel)
router.get('/track/open/:messageId', emailsController.trackOpen);

// GET /api/emails/track/click/:messageId - Tracking de clique
router.get('/track/click/:messageId', emailsController.trackClick);

/**
 * Rotas autenticadas
 */
router.use(authenticate);

/**
 * GET /api/emails
 * Lista todos os emails
 * Permissão: viewEmailHistory (admin, financeiro)
 */
router.get('/', requirePermission('viewEmailHistory'), emailsController.listEmails);

/**
 * GET /api/emails/stats
 * Estatísticas de emails
 * Permissão: viewEmailHistory (admin, financeiro)
 */
router.get('/stats', requirePermission('viewEmailHistory'), emailsController.getEmailStats);

/**
 * GET /api/emails/templates
 * Lista templates disponíveis
 * Permissão: sendEmail (admin, financeiro, vendedor)
 */
router.get('/templates', requirePermission('sendEmail'), emailsController.listTemplates);

/**
 * POST /api/emails/templates/:templateId/process
 * Processa template com dados
 * Permissão: sendEmail (admin, financeiro, vendedor)
 */
router.post('/templates/:templateId/process', requirePermission('sendEmail'), emailsController.processTemplate);

/**
 * GET /api/emails/lead/:leadId
 * Emails de um lead específico
 * Permissão: sendEmail (admin, financeiro, vendedor)
 */
router.get('/lead/:leadId', requirePermission('sendEmail'), emailsController.getEmailsByLead);

/**
 * GET /api/emails/:id
 * Obtém um email por ID
 * Permissão: viewEmailHistory (admin, financeiro)
 */
router.get('/:id', requirePermission('viewEmailHistory'), emailsController.getEmail);

/**
 * POST /api/emails
 * Envia um novo email
 * Permissão: sendEmail (admin, financeiro, vendedor)
 */
router.post('/', requirePermission('sendEmail'), emailsController.sendEmail);

/**
 * POST /api/emails/:id/resend
 * Reenvia um email que falhou
 * Permissão: sendEmail (admin, financeiro, vendedor)
 */
router.post('/:id/resend', requirePermission('sendEmail'), emailsController.resendEmail);

export default router;
