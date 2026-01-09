import { Activity, IActivity } from '../models/Activity.model.js';
import { Types } from 'mongoose';

export class ActivityService {
  // Criar uma atividade
  static async createActivity(data: {
    leadId: string | Types.ObjectId;
    tipo: IActivity['tipo'];
    descricao: string;
    userId: string | Types.ObjectId;
    userName: string;
    metadata?: IActivity['metadata'];
  }) {
    try {
      const activity = new Activity({
        leadId: new Types.ObjectId(data.leadId.toString()),
        tipo: data.tipo,
        descricao: data.descricao,
        userId: new Types.ObjectId(data.userId.toString()),
        userName: data.userName,
        metadata: data.metadata
      });

      await activity.save();
      return activity;
    } catch (error) {
      console.error('Erro ao criar atividade:', error);
      throw error;
    }
  }

  // Buscar atividades de um lead
  static async getLeadActivities(leadId: string, limit = 20) {
    try {
      const activities = await Activity.find({ leadId: new Types.ObjectId(leadId) })
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

      return activities;
    } catch (error) {
      console.error('Erro ao buscar atividades:', error);
      throw error;
    }
  }

  // Buscar atividades recentes de todos os leads (para dashboard)
  static async getRecentActivities(limit = 50) {
    try {
      const activities = await Activity.find()
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('leadId', 'nome empresa')
        .lean();

      return activities;
    } catch (error) {
      console.error('Erro ao buscar atividades recentes:', error);
      throw error;
    }
  }

  // Deletar atividades antigas (manutenção)
  static async deleteOldActivities(daysOld = 90) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await Activity.deleteMany({
        createdAt: { $lt: cutoffDate }
      });

      return result;
    } catch (error) {
      console.error('Erro ao deletar atividades antigas:', error);
      throw error;
    }
  }
}
