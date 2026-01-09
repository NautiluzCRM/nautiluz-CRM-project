import { Request, Response, NextFunction } from 'express';
import { NotificationsService } from './notifications.service.js';
import { asyncHandler } from '../../common/http.js';

// Extender o tipo Request para incluir user
interface AuthRequest extends Request {
  user?: {
    id: string;
    sub: string;
    role: string;
  };
  query: Request['query'];
  params: Request['params'];
}

const notificationsService = new NotificationsService();

/**
 * GET /api/notifications
 * Lista todas as notificações do usuário autenticado
 */
export const getNotifications = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.sub || req.user?.id;
  
  if (!userId) {
    return res.status(401).json({ message: 'Usuário não autenticado' });
  }

  const { unreadOnly, limit } = req.query;

  const notifications = await notificationsService.getNotifications(userId, {
    unreadOnly: unreadOnly === 'true',
    limit: limit ? parseInt(limit as string, 10) : undefined,
  });

  return res.json(notifications);
});

/**
 * GET /api/notifications/unread-count
 * Retorna o número de notificações não lidas
 */
export const getUnreadCount = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.sub || req.user?.id;
  
  if (!userId) {
    return res.status(401).json({ message: 'Usuário não autenticado' });
  }

  const count = await notificationsService.getUnreadCount(userId);

  return res.json({ count });
});

/**
 * PATCH /api/notifications/:id/read
 * Marca uma notificação como lida
 */
export const markAsRead = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.sub || req.user?.id;
  const { id } = req.params;

  if (!userId) {
    return res.status(401).json({ message: 'Usuário não autenticado' });
  }

  const notification = await notificationsService.markAsRead(id, userId);

  if (!notification) {
    return res.status(404).json({ message: 'Notificação não encontrada' });
  }

  return res.json(notification);
});

/**
 * PATCH /api/notifications/mark-all-read
 * Marca todas as notificações do usuário como lidas
 */
export const markAllAsRead = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.sub || req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: 'Usuário não autenticado' });
  }

  const count = await notificationsService.markAllAsRead(userId);

  return res.json({ message: 'Todas as notificações foram marcadas como lidas', count });
});

/**
 * DELETE /api/notifications/:id
 * Deleta uma notificação
 */
export const deleteNotification = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.sub || req.user?.id;
  const { id } = req.params;

  if (!userId) {
    return res.status(401).json({ message: 'Usuário não autenticado' });
  }

  const deleted = await notificationsService.deleteNotification(id, userId);

  if (!deleted) {
    return res.status(404).json({ message: 'Notificação não encontrada' });
  }

  return res.json({ message: 'Notificação deletada com sucesso' });
});

/**
 * DELETE /api/notifications/clear-read
 * Deleta todas as notificações lidas do usuário
 */
export const clearReadNotifications = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.sub || req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: 'Usuário não autenticado' });
  }

  const count = await notificationsService.deleteReadNotifications(userId);

  return res.json({ message: 'Notificações lidas foram removidas', count });
});
