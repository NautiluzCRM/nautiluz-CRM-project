import { LeadModel } from './lead.model.js';
import { StageModel } from '../pipelines/stage.model.js';
import { Types } from 'mongoose';
import { logger } from '../../config/logger.js';

/**
 * Calcula a data de vencimento de um lead baseado no SLA da stage
 * @param leadId - ID do lead
 * @param stageId - ID da stage onde o lead está
 * @param enteredAt - Data/hora que entrou na stage (opcional, usa agora se não informado)
 */
export async function calculateDueDate(
  leadId: string | Types.ObjectId,
  stageId: string | Types.ObjectId,
  enteredAt?: Date
): Promise<Date | null> {
  try {
    const stage = await StageModel.findById(stageId);
    
    if (!stage || !stage.sla || stage.sla === 0) {
      return null; // Stage sem SLA configurado
    }

    const enterTime = enteredAt || new Date();
    const dueDate = new Date(enterTime);
    dueDate.setHours(dueDate.getHours() + stage.sla);

    // Atualiza o lead com a data de vencimento
    await LeadModel.updateOne(
      { _id: leadId },
      {
        $set: {
          enteredStageAt: enterTime,
          dueDate: dueDate,
          isOverdue: false,
          overdueHours: 0
        }
      }
    );

    return dueDate;
  } catch (error) {
    logger.error({ error, leadId, stageId }, 'Erro ao calcular data de vencimento');
    return null;
  }
}

/**
 * Verifica e atualiza o status de atraso de um lead
 * @param leadId - ID do lead
 */
export async function checkOverdue(leadId: string | Types.ObjectId): Promise<{
  isOverdue: boolean;
  overdueHours: number;
  daysUntilDue?: number;
  hoursUntilDue?: number;
}> {
  try {
    const lead = await LeadModel.findById(leadId).select('dueDate isOverdue overdueHours');
    
    if (!lead || !lead.dueDate) {
      return { isOverdue: false, overdueHours: 0 };
    }

    const now = new Date();
    const diffMs = now.getTime() - lead.dueDate.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    const isOverdue = diffHours > 0;
    const overdueHours = isOverdue ? diffHours : 0;
    const hoursUntilDue = isOverdue ? 0 : Math.abs(diffHours);
    const daysUntilDue = Math.floor(hoursUntilDue / 24);

    // Atualiza o lead se mudou o status
    if (lead.isOverdue !== isOverdue || lead.overdueHours !== overdueHours) {
      await LeadModel.updateOne(
        { _id: leadId },
        {
          $set: {
            isOverdue,
            overdueHours
          }
        }
      );
    }

    return {
      isOverdue,
      overdueHours,
      daysUntilDue: isOverdue ? 0 : daysUntilDue,
      hoursUntilDue: isOverdue ? 0 : hoursUntilDue
    };
  } catch (error) {
    logger.error({ error, leadId }, 'Erro ao verificar atraso do lead');
    return { isOverdue: false, overdueHours: 0 };
  }
}

/**
 * Atualiza todos os leads atrasados do sistema
 * Deve ser executado periodicamente (cron job)
 */
export async function updateAllOverdueLeads(): Promise<{
  total: number;
  overdue: number;
  updated: number;
}> {
  try {
    // Busca todos os leads com dueDate definido
    const leads = await LeadModel.find({
      dueDate: { $exists: true, $ne: null }
    }).select('_id dueDate isOverdue overdueHours');

    let overdueCount = 0;
    let updatedCount = 0;
    const now = new Date();

    const updates = leads.map(async (lead) => {
      const diffMs = now.getTime() - lead.dueDate!.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const isOverdue = diffHours > 0;
      const overdueHours = isOverdue ? diffHours : 0;

      if (isOverdue) overdueCount++;

      if (lead.isOverdue !== isOverdue || lead.overdueHours !== overdueHours) {
        updatedCount++;
        return LeadModel.updateOne(
          { _id: lead._id },
          {
            $set: {
              isOverdue,
              overdueHours
            }
          }
        );
      }
    });

    await Promise.all(updates);

    logger.info({
      total: leads.length,
      overdue: overdueCount,
      updated: updatedCount
    }, 'Leads atrasados atualizados');

    return {
      total: leads.length,
      overdue: overdueCount,
      updated: updatedCount
    };
  } catch (error) {
    logger.error({ error }, 'Erro ao atualizar leads atrasados');
    throw error;
  }
}

/**
 * Obtém leads que vencem em X horas
 * @param hours - Número de horas para o vencimento
 */
export async function getLeadsDueSoon(hours: number = 24): Promise<any[]> {
  try {
    const now = new Date();
    const futureDate = new Date(now.getTime() + hours * 60 * 60 * 1000);

    const leads = await LeadModel.find({
      dueDate: {
        $gte: now,
        $lte: futureDate
      },
      isOverdue: false
    })
      .populate('owners', 'name email')
      .populate('stageId', 'name color')
      .sort({ dueDate: 1 });

    return leads;
  } catch (error) {
    logger.error({ error, hours }, 'Erro ao buscar leads próximos do vencimento');
    return [];
  }
}

/**
 * Obtém estatísticas de SLA por pipeline
 */
export async function getSLAStatsByPipeline(pipelineId: string): Promise<{
  total: number;
  onTime: number;
  overdue: number;
  noSLA: number;
  avgOverdueHours: number;
}> {
  try {
    const leads = await LeadModel.find({ pipelineId });

    const total = leads.length;
    const overdue = leads.filter(l => l.isOverdue).length;
    const onTime = leads.filter(l => l.dueDate && !l.isOverdue).length;
    const noSLA = leads.filter(l => !l.dueDate).length;

    const totalOverdueHours = leads.reduce((sum, l) => sum + (l.overdueHours || 0), 0);
    const avgOverdueHours = overdue > 0 ? Math.floor(totalOverdueHours / overdue) : 0;

    return {
      total,
      onTime,
      overdue,
      noSLA,
      avgOverdueHours
    };
  } catch (error) {
    logger.error({ error, pipelineId }, 'Erro ao calcular estatísticas de SLA');
    throw error;
  }
}

/**
 * Regras de qualificação de leads
 * Define o que é um lead qualificado vs não qualificado
 */
export interface QualificationCriteria {
  hasContact: boolean; // Tem telefone ou email
  hasCompanyData: boolean; // Tem dados da empresa
  hasLivesCount: boolean; // Tem quantidade de vidas
  hasBudget: boolean; // Tem informação de orçamento
  isEngaged: boolean; // Teve contato recente (últimos 7 dias)
  score: number; // Pontuação 0-100
}

/**
 * Avalia a qualificação de um lead
 */
export async function evaluateLeadQualification(leadId: string | Types.ObjectId): Promise<QualificationCriteria> {
  try {
    const lead = await LeadModel.findById(leadId);

    if (!lead) {
      throw new Error('Lead não encontrado');
    }

    const hasContact = !!(lead.phone || lead.email || lead.whatsapp);
    const hasCompanyData = !!(lead.company || lead.hasCnpj);
    const hasLivesCount = !!lead.livesCount && lead.livesCount > 0;
    const hasBudget = !!lead.avgPrice || !!lead.valorProposta;
    
    // Verifica se teve contato nos últimos 7 dias
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const isEngaged = !!(lead.lastContactAt && lead.lastContactAt > sevenDaysAgo);

    // Calcula score
    let score = 0;
    if (hasContact) score += 20;
    if (hasCompanyData) score += 20;
    if (hasLivesCount) score += 20;
    if (hasBudget) score += 20;
    if (isEngaged) score += 20;

    // Atualiza o score no lead
    await LeadModel.updateOne(
      { _id: leadId },
      { $set: { score } }
    );

    return {
      hasContact,
      hasCompanyData,
      hasLivesCount,
      hasBudget,
      isEngaged,
      score
    };
  } catch (error) {
    logger.error({ error, leadId }, 'Erro ao avaliar qualificação do lead');
    throw error;
  }
}

/**
 * Sugere o status de qualificação baseado nos critérios
 */
export function suggestQualificationStatus(criteria: QualificationCriteria): string {
  if (criteria.score >= 80) {
    return 'qualificado';
  } else if (criteria.score >= 60) {
    return 'em_contato';
  } else if (criteria.score >= 40) {
    return 'novo';
  } else {
    return 'sem_interesse';
  }
}
