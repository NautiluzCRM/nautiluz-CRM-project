import { Notification, INotification } from '../../models/Notification.model.js';
import mongoose from 'mongoose';

export interface CreateNotificationDto {
  userId: string;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error' | 'lead' | 'system';
  link?: string;
  metadata?: Record<string, any>;
}

export class NotificationsService {
  /**
   * Cria uma nova notificação para um usuário
   */
  async createNotification(data: CreateNotificationDto): Promise<INotification> {
    const notification = new Notification({
      userId: new mongoose.Types.ObjectId(data.userId),
      title: data.title,
      message: data.message,
      type: data.type || 'info',
      link: data.link,
      metadata: data.metadata,
      read: false,
    });

    await notification.save();
    return notification;
  }

  /**
   * Busca todas as notificações de um usuário (opcionalmente apenas não lidas)
   */
  async getNotifications(
    userId: string,
    options: { unreadOnly?: boolean; limit?: number } = {}
  ): Promise<INotification[]> {
    const query: any = { userId: new mongoose.Types.ObjectId(userId) };

    if (options.unreadOnly) {
      query.read = false;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(options.limit || 50);

    return notifications;
  }

  /**
   * Conta notificações não lidas de um usuário
   */
  async getUnreadCount(userId: string): Promise<number> {
    const count = await Notification.countDocuments({
      userId: new mongoose.Types.ObjectId(userId),
      read: false,
    });

    return count;
  }

  /**
   * Marca uma notificação como lida
   */
  async markAsRead(notificationId: string, userId: string): Promise<INotification | null> {
    const notification = await Notification.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(notificationId),
        userId: new mongoose.Types.ObjectId(userId),
      },
      { read: true },
      { new: true }
    );

    return notification;
  }

  /**
   * Marca todas as notificações de um usuário como lidas
   */
  async markAllAsRead(userId: string): Promise<number> {
    const result = await Notification.updateMany(
      {
        userId: new mongoose.Types.ObjectId(userId),
        read: false,
      },
      { read: true }
    );

    return result.modifiedCount;
  }

  /**
   * Deleta uma notificação
   */
  async deleteNotification(notificationId: string, userId: string): Promise<boolean> {
    const result = await Notification.deleteOne({
      _id: new mongoose.Types.ObjectId(notificationId),
      userId: new mongoose.Types.ObjectId(userId),
    });

    return result.deletedCount > 0;
  }

  /**
   * Deleta todas as notificações lidas de um usuário (limpeza)
   */
  async deleteReadNotifications(userId: string): Promise<number> {
    const result = await Notification.deleteMany({
      userId: new mongoose.Types.ObjectId(userId),
      read: true,
    });

    return result.deletedCount;
  }

  /**
   * Cria notificação de novo lead atribuído
   */
  async notifyNewLeadAssigned(
    userId: string,
    leadName: string,
    leadId: string
  ): Promise<INotification> {
    return this.createNotification({
      userId,
      title: 'Novo Lead Atribuído',
      message: `O lead "${leadName}" foi atribuído a você.`,
      type: 'lead',
      link: `/leads/${leadId}`,
      metadata: { leadId, leadName },
    });
  }

  /**
   * Cria notificação de lead movido no pipeline
   */
  async notifyLeadStageChanged(
    userId: string,
    leadName: string,
    stageName: string,
    leadId: string
  ): Promise<INotification> {
    return this.createNotification({
      userId,
      title: 'Lead Mudou de Etapa',
      message: `O lead "${leadName}" foi movido para "${stageName}".`,
      type: 'info',
      link: `/leads/${leadId}`,
      metadata: { leadId, leadName, stageName },
    });
  }

  /**
   * Cria notificação de SLA próximo do vencimento
   */
  async notifySLAWarning(
    userId: string,
    leadName: string,
    hoursRemaining: number,
    leadId: string
  ): Promise<INotification> {
    return this.createNotification({
      userId,
      title: 'Atenção: SLA Próximo do Vencimento',
      message: `O lead "${leadName}" tem apenas ${hoursRemaining}h restantes no SLA.`,
      type: 'warning',
      link: `/leads/${leadId}`,
      metadata: { leadId, leadName, hoursRemaining },
    });
  }
}
