import { Request, Response, NextFunction } from 'express';
import * as emailsService from './emails.service.js';
import { StatusCodes } from 'http-status-codes';

/**
 * Lista todos os emails com filtros
 */
export async function listEmails(req: Request, res: Response, next: NextFunction) {
  try {
    const user = (req as any).user;
    const emails = await emailsService.listEmails(req.query as any, user);
    res.json(emails);
  } catch (error) {
    next(error);
  }
}

/**
 * Obtém um email por ID
 */
export async function getEmail(req: Request, res: Response, next: NextFunction) {
  try {
    const user = (req as any).user;
    const email = await emailsService.getEmail(req.params.id, user);
    res.json(email);
  } catch (error) {
    next(error);
  }
}

/**
 * Envia um novo email
 */
export async function sendEmail(req: Request, res: Response, next: NextFunction) {
  try {
    const user = (req as any).user;
    const email = await emailsService.sendEmail(req.body, user);
    res.status(StatusCodes.CREATED).json(email);
  } catch (error) {
    next(error);
  }
}

/**
 * Reenvia um email que falhou
 */
export async function resendEmail(req: Request, res: Response, next: NextFunction) {
  try {
    const user = (req as any).user;
    const email = await emailsService.resendEmail(req.params.id, user);
    res.json(email);
  } catch (error) {
    next(error);
  }
}

/**
 * Obtém estatísticas de emails
 */
export async function getEmailStats(req: Request, res: Response, next: NextFunction) {
  try {
    const user = (req as any).user;
    const stats = await emailsService.getEmailStats(user);
    res.json(stats);
  } catch (error) {
    next(error);
  }
}

/**
 * Obtém emails de um lead específico
 */
export async function getEmailsByLead(req: Request, res: Response, next: NextFunction) {
  try {
    const user = (req as any).user;
    const emails = await emailsService.getEmailsByLead(req.params.leadId, user);
    res.json(emails);
  } catch (error) {
    next(error);
  }
}

/**
 * Webhook para tracking de abertura
 */
export async function trackOpen(req: Request, res: Response, next: NextFunction) {
  try {
    const { messageId } = req.params;
    await emailsService.markEmailAsOpened(messageId);
    
    // Retorna um pixel transparente 1x1
    const pixel = Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'base64'
    );
    res.writeHead(200, {
      'Content-Type': 'image/gif',
      'Content-Length': pixel.length
    });
    res.end(pixel);
  } catch (error) {
    next(error);
  }
}

/**
 * Webhook para tracking de clique
 */
export async function trackClick(req: Request, res: Response, next: NextFunction) {
  try {
    const { messageId } = req.params;
    const { url } = req.query;
    
    await emailsService.markEmailAsClicked(messageId);
    
    // Redireciona para a URL original
    res.redirect(url as string || '/');
  } catch (error) {
    next(error);
  }
}

/**
 * Lista templates disponíveis
 */
export async function listTemplates(req: Request, res: Response, next: NextFunction) {
  try {
    const templates = Object.keys(emailsService.emailTemplates).map(key => ({
      id: key,
      ...(emailsService.emailTemplates as any)[key]
    }));
    res.json(templates);
  } catch (error) {
    next(error);
  }
}

/**
 * Processa um template com dados
 */
export async function processTemplate(req: Request, res: Response, next: NextFunction) {
  try {
    const { templateId } = req.params;
    const data = req.body;
    const result = emailsService.processEmailTemplate(
      templateId as keyof typeof emailsService.emailTemplates,
      data
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
}
