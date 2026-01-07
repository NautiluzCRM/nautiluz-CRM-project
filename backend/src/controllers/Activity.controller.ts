import { Request, Response } from 'express';
import { ActivityService } from '../services/activity.service.js';

export class ActivityController {
  // GET /api/leads/:leadId/activities
  static async getLeadActivities(req: Request, res: Response) {
    try {
      const { leadId } = req.params;
      const limit = parseInt(req.query.limit as string) || 20;

      const activities = await ActivityService.getLeadActivities(leadId, limit);

      res.json(activities);
    } catch (error: any) {
      console.error('Erro ao buscar atividades:', error);
      res.status(500).json({ error: error.message || 'Erro ao buscar atividades' });
    }
  }

  // GET /api/activities/recent
  static async getRecentActivities(req: Request, res: Response) {
    try {
      const limit = parseInt(req.query.limit as string) || 50;

      const activities = await ActivityService.getRecentActivities(limit);

      res.json(activities);
    } catch (error: any) {
      console.error('Erro ao buscar atividades recentes:', error);
      res.status(500).json({ error: error.message || 'Erro ao buscar atividades recentes' });
    }
  }
}
