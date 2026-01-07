import { Request, Response, NextFunction } from 'express';
import * as alertsService from './alerts.service.js';
import { StatusCodes } from 'http-status-codes';

/**
 * Lista alertas do usuário
 */
export async function listAlerts(req: Request, res: Response, next: NextFunction) {
  try {
    const user = (req as any).user;
    const alerts = await alertsService.listAlerts(req.query as any, user);
    res.json(alerts);
  } catch (error) {
    next(error);
  }
}

/**
 * Conta alertas não lidos
 */
export async function countUnread(req: Request, res: Response, next: NextFunction) {
  try {
    const user = (req as any).user;
    const count = await alertsService.countUnreadAlerts(user);
    res.json({ count });
  } catch (error) {
    next(error);
  }
}

/**
 * Obtém um alerta por ID
 */
export async function getAlert(req: Request, res: Response, next: NextFunction) {
  try {
    const user = (req as any).user;
    const alert = await alertsService.getAlert(req.params.id, user);
    res.json(alert);
  } catch (error) {
    next(error);
  }
}

/**
 * Marca alerta como lido
 */
export async function markAsRead(req: Request, res: Response, next: NextFunction) {
  try {
    const user = (req as any).user;
    const alert = await alertsService.markAsRead(req.params.id, user);
    res.json(alert);
  } catch (error) {
    next(error);
  }
}

/**
 * Marca alerta como resolvido
 */
export async function markAsResolved(req: Request, res: Response, next: NextFunction) {
  try {
    const user = (req as any).user;
    const alert = await alertsService.markAsResolved(req.params.id, user);
    res.json(alert);
  } catch (error) {
    next(error);
  }
}

/**
 * Marca todos os alertas como lidos
 */
export async function markAllAsRead(req: Request, res: Response, next: NextFunction) {
  try {
    const user = (req as any).user;
    const result = await alertsService.markAllAsRead(user);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * Ignora um alerta
 */
export async function ignoreAlert(req: Request, res: Response, next: NextFunction) {
  try {
    const user = (req as any).user;
    const alert = await alertsService.ignoreAlert(req.params.id, user);
    res.json(alert);
  } catch (error) {
    next(error);
  }
}

/**
 * Gera alertas de apólices (admin/cron)
 */
export async function generateApoliceAlerts(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await alertsService.generateApoliceAlerts();
    res.json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * Gera alertas de leads (admin/cron)
 */
export async function generateLeadAlerts(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await alertsService.generateLeadAlerts();
    res.json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * Limpa alertas antigos (admin/cron)
 */
export async function cleanupAlerts(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await alertsService.cleanupOldAlerts();
    res.json(result);
  } catch (error) {
    next(error);
  }
}
