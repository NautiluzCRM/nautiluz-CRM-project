import { Router } from 'express';
import { 
  metaWebhookHandler, 
  metaWebhookVerify,
  metaWebhookByIdHandler,
  listIntegrationsHandler,
  getIntegrationHandler,
  createIntegrationHandler,
  updateIntegrationHandler,
  deleteIntegrationHandler,
  testIntegrationHandler,
  getIntegrationStatsHandler
} from './meta-leads.controller.js';
import { authenticate } from '../../rbac/rbac.middleware.js';
import { requireRole } from '../../rbac/rbac.guard.js';

const router = Router();

// ============================================
// WEBHOOKS (públicos - sem autenticação)
// ============================================

// Verificação do webhook do Meta (GET)
router.get('/webhook', metaWebhookVerify);

// Receber leads do webhook (POST)
router.post('/webhook', metaWebhookHandler);

// Webhook com ID específico (para múltiplas integrações)
router.get('/webhook/:integrationId', metaWebhookVerify);
router.post('/webhook/:integrationId', metaWebhookByIdHandler);

// ============================================
// CRUD de Integrações (autenticado - admin)
// ============================================

// Listar integrações
router.get('/', authenticate, requireRole(['admin']), listIntegrationsHandler);

// Criar integração
router.post('/', authenticate, requireRole(['admin']), createIntegrationHandler);

// Obter integração por ID
router.get('/:id', authenticate, requireRole(['admin']), getIntegrationHandler);

// Atualizar integração
router.patch('/:id', authenticate, requireRole(['admin']), updateIntegrationHandler);

// Deletar integração
router.delete('/:id', authenticate, requireRole(['admin']), deleteIntegrationHandler);

// Testar integração (cria lead de teste)
router.post('/:id/test', authenticate, requireRole(['admin']), testIntegrationHandler);

// Estatísticas da integração
router.get('/:id/stats', authenticate, requireRole(['admin']), getIntegrationStatsHandler);

export default router;
