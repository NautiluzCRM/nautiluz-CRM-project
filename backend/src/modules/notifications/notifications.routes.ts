import { Router } from 'express';
import { authenticate } from '../../rbac/rbac.middleware.js';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearReadNotifications,
} from './notifications.controller.js';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authenticate);

// GET /api/notifications - Lista notificações
router.get('/', getNotifications);

// GET /api/notifications/unread-count - Conta não lidas
router.get('/unread-count', getUnreadCount);

// PATCH /api/notifications/mark-all-read - Marca todas como lidas
router.patch('/mark-all-read', markAllAsRead);

// DELETE /api/notifications/clear-read - Remove todas lidas
router.delete('/clear-read', clearReadNotifications);

// PATCH /api/notifications/:id/read - Marca uma como lida
router.patch('/:id/read', markAsRead);

// DELETE /api/notifications/:id - Deleta uma notificação
router.delete('/:id', deleteNotification);

export default router;
