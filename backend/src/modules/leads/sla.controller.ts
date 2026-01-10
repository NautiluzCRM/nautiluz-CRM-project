import { Request, Response, NextFunction } from 'express';
import * as slaService from './sla.service.js';
import { StatusCodes } from 'http-status-codes';

/**
 * Verifica o status de SLA de um lead específico
 */
export async function checkLeadSLA(req: Request, res: Response, next: NextFunction) {
  try {
    const { leadId } = req.params;
    const status = await slaService.checkOverdue(leadId);
    res.json(status);
  } catch (error) {
    next(error);
  }
}

/**
 * Atualiza todos os leads atrasados
 * Rota administrativa
 */
export async function updateAllOverdue(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await slaService.updateAllOverdueLeads();
    res.json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * Busca leads próximos do vencimento
 */
export async function getLeadsDueSoon(req: Request, res: Response, next: NextFunction) {
  try {
    const hours = parseInt(req.query.hours as string) || 24;
    const leads = await slaService.getLeadsDueSoon(hours);
    res.json(leads);
  } catch (error) {
    next(error);
  }
}

/**
 * Obtém estatísticas de SLA por pipeline
 */
export async function getSLAStats(req: Request, res: Response, next: NextFunction) {
  try {
    const { pipelineId } = req.params;
    const stats = await slaService.getSLAStatsByPipeline(pipelineId);
    res.json(stats);
  } catch (error) {
    next(error);
  }
}

/**
 * Avalia qualificação de um lead
 */
export async function evaluateQualification(req: Request, res: Response, next: NextFunction) {
  try {
    const { leadId } = req.params;
    const criteria = await slaService.evaluateLeadQualification(leadId);
    const suggestedStatus = slaService.suggestQualificationStatus(criteria);
    
    res.json({
      criteria,
      suggestedStatus,
      isQualified: criteria.score >= 60
    });
  } catch (error) {
    next(error);
  }
}
