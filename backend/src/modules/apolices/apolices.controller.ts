import { Request, Response, NextFunction } from 'express';
import * as apolicesService from './apolices.service.js';
import { StatusCodes } from 'http-status-codes';

/**
 * Lista todas as apólices com filtros
 */
export async function listApolices(req: Request, res: Response, next: NextFunction) {
  try {
    const user = (req as any).user;
    const apolices = await apolicesService.listApolices(req.query as any, user);
    res.json(apolices);
  } catch (error) {
    next(error);
  }
}

/**
 * Obtém uma apólice por ID
 */
export async function getApolice(req: Request, res: Response, next: NextFunction) {
  try {
    const user = (req as any).user;
    const apolice = await apolicesService.getApolice(req.params.id, user);
    res.json(apolice);
  } catch (error) {
    next(error);
  }
}

/**
 * Cria uma nova apólice
 */
export async function createApolice(req: Request, res: Response, next: NextFunction) {
  try {
    const user = (req as any).user;
    const apolice = await apolicesService.createApolice(req.body, user);
    res.status(StatusCodes.CREATED).json(apolice);
  } catch (error) {
    next(error);
  }
}

/**
 * Atualiza uma apólice existente
 */
export async function updateApolice(req: Request, res: Response, next: NextFunction) {
  try {
    const user = (req as any).user;
    const apolice = await apolicesService.updateApolice(req.params.id, req.body, user);
    res.json(apolice);
  } catch (error) {
    next(error);
  }
}

/**
 * Exclui uma apólice
 */
export async function deleteApolice(req: Request, res: Response, next: NextFunction) {
  try {
    const user = (req as any).user;
    const result = await apolicesService.deleteApolice(req.params.id, user);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * Lista apólices próximas do vencimento
 */
export async function getApolicesVencendo(req: Request, res: Response, next: NextFunction) {
  try {
    const user = (req as any).user;
    const dias = parseInt(req.query.dias as string) || 30;
    const apolices = await apolicesService.getApolicesVencendo(dias, user);
    res.json(apolices);
  } catch (error) {
    next(error);
  }
}

/**
 * Obtém estatísticas das apólices
 */
export async function getApolicesStats(req: Request, res: Response, next: NextFunction) {
  try {
    const user = (req as any).user;
    const stats = await apolicesService.getApolicesStats(user);
    res.json(stats);
  } catch (error) {
    next(error);
  }
}

/**
 * Vincula uma apólice a um lead
 */
export async function vincularAoLead(req: Request, res: Response, next: NextFunction) {
  try {
    const user = (req as any).user;
    const { leadId } = req.body;
    const apolice = await apolicesService.vincularApoliceAoLead(req.params.id, leadId, user);
    res.json(apolice);
  } catch (error) {
    next(error);
  }
}

/**
 * Atualiza status das apólices vencidas (admin/cron)
 */
export async function atualizarStatusVencidas(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await apolicesService.atualizarStatusApolicesVencidas();
    res.json(result);
  } catch (error) {
    next(error);
  }
}
