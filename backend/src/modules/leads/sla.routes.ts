import { Router } from 'express';
import * as slaController from './sla.controller.js';
import { authenticate, requirePermission } from '../../rbac/rbac.middleware.js';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authenticate);

// Verificar SLA de um lead específico
router.get('/leads/:leadId/sla', slaController.checkLeadSLA);

// Avaliar qualificação de um lead
router.get('/leads/:leadId/qualification', slaController.evaluateQualification);

// Buscar leads próximos do vencimento
router.get('/due-soon', slaController.getLeadsDueSoon);

// Estatísticas de SLA por pipeline
router.get('/pipelines/:pipelineId/stats', slaController.getSLAStats);

// Atualizar todos os leads atrasados (admin apenas)
router.post('/update-all', requirePermission('manageUsers'), slaController.updateAllOverdue);

export default router;
