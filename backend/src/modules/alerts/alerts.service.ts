import { AlertModel, Alert, AlertType, AlertPriority, AlertStatus } from './alert.model.js';
import { ApoliceModel } from '../apolices/apolice.model.js';
import { LeadModel } from '../leads/lead.model.js';
import { UserModel } from '../users/user.model.js';
import { AppError } from '../../common/http.js';
import { StatusCodes } from 'http-status-codes';
import mongoose, { Types } from 'mongoose';

interface UserAuth {
  sub: string;
  role: string;
}

interface AlertFilter {
  status?: AlertStatus | 'all';
  type?: AlertType | 'all';
  priority?: AlertPriority | 'all';
  leadId?: string;
  apoliceId?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * Lista alertas do usuário
 */
export async function listAlerts(filter: AlertFilter = {}, user?: UserAuth) {
  const query: any = {};
  
  // Usuário só vê seus próprios alertas
  if (user?.sub) {
    query.userId = user.sub;
  }
  
  // Filtra alertas já agendados
  query.$or = [
    { scheduledFor: { $exists: false } },
    { scheduledFor: { $lte: new Date() } }
  ];
  
  // Filtra alertas expirados
  query.$and = query.$and || [];
  query.$and.push({
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: { $gt: new Date() } }
    ]
  });
  
  if (filter.status && filter.status !== 'all') {
    query.status = filter.status;
  }
  
  if (filter.type && filter.type !== 'all') {
    query.type = filter.type;
  }
  
  if (filter.priority && filter.priority !== 'all') {
    query.priority = filter.priority;
  }
  
  if (filter.leadId) {
    query.leadId = filter.leadId;
  }
  
  if (filter.apoliceId) {
    query.apoliceId = filter.apoliceId;
  }
  
  if (filter.startDate || filter.endDate) {
    query.createdAt = {};
    if (filter.startDate) {
      query.createdAt.$gte = new Date(filter.startDate);
    }
    if (filter.endDate) {
      query.createdAt.$lte = new Date(filter.endDate);
    }
  }
  
  return AlertModel.find(query)
    .sort({ priority: -1, createdAt: -1 })
    .populate('leadId', 'name company')
    .populate('apoliceId', 'numeroApolice empresaNome')
    .limit(100);
}

/**
 * Conta alertas não lidos do usuário
 */
export async function countUnreadAlerts(user?: UserAuth) {
  if (!user?.sub) return 0;
  
  return AlertModel.countDocuments({
    userId: user.sub,
    status: 'ativo',
    $or: [
      { scheduledFor: { $exists: false } },
      { scheduledFor: { $lte: new Date() } }
    ]
  });
}

/**
 * Obtém um alerta por ID
 */
export async function getAlert(id: string, user?: UserAuth) {
  const alert = await AlertModel.findById(id)
    .populate('leadId', 'name company email phone')
    .populate('apoliceId', 'numeroApolice empresaNome operadora');
  
  if (!alert) {
    throw new AppError('Alerta não encontrado', StatusCodes.NOT_FOUND);
  }
  
  // Verifica se o alerta pertence ao usuário
  if (user && alert.userId.toString() !== user.sub && user.role !== 'admin') {
    throw new AppError('Acesso negado', StatusCodes.FORBIDDEN);
  }
  
  return alert;
}

/**
 * Cria um novo alerta
 */
export async function createAlert(input: Partial<Alert>) {
  return AlertModel.create(input);
}

/**
 * Marca alerta como lido
 */
export async function markAsRead(id: string, user?: UserAuth) {
  const alert = await AlertModel.findById(id);
  
  if (!alert) {
    throw new AppError('Alerta não encontrado', StatusCodes.NOT_FOUND);
  }
  
  if (user && alert.userId.toString() !== user.sub && user.role !== 'admin') {
    throw new AppError('Acesso negado', StatusCodes.FORBIDDEN);
  }
  
  alert.status = 'lido';
  alert.readAt = new Date();
  await alert.save();
  
  return alert;
}

/**
 * Marca alerta como resolvido
 */
export async function markAsResolved(id: string, user?: UserAuth) {
  const alert = await AlertModel.findById(id);
  
  if (!alert) {
    throw new AppError('Alerta não encontrado', StatusCodes.NOT_FOUND);
  }
  
  if (user && alert.userId.toString() !== user.sub && user.role !== 'admin') {
    throw new AppError('Acesso negado', StatusCodes.FORBIDDEN);
  }
  
  alert.status = 'resolvido';
  alert.resolvedAt = new Date();
  await alert.save();
  
  return alert;
}

/**
 * Marca todos os alertas como lidos
 */
export async function markAllAsRead(user?: UserAuth) {
  if (!user?.sub) {
    throw new AppError('Usuário não autenticado', StatusCodes.UNAUTHORIZED);
  }
  
  await AlertModel.updateMany(
    { userId: user.sub, status: 'ativo' },
    { status: 'lido', readAt: new Date() }
  );
  
  return { message: 'Todos os alertas foram marcados como lidos' };
}

/**
 * Ignora um alerta
 */
export async function ignoreAlert(id: string, user?: UserAuth) {
  const alert = await AlertModel.findById(id);
  
  if (!alert) {
    throw new AppError('Alerta não encontrado', StatusCodes.NOT_FOUND);
  }
  
  if (user && alert.userId.toString() !== user.sub && user.role !== 'admin') {
    throw new AppError('Acesso negado', StatusCodes.FORBIDDEN);
  }
  
  alert.status = 'ignorado';
  await alert.save();
  
  return alert;
}

/**
 * Gera alertas para apólices próximas do vencimento
 * Deve ser chamado por um cron job diariamente
 */
export async function generateApoliceAlerts() {
  const hoje = new Date();
  const em30Dias = new Date();
  em30Dias.setDate(hoje.getDate() + 30);
  
  const em7Dias = new Date();
  em7Dias.setDate(hoje.getDate() + 7);
  
  // Busca apólices vencendo em 30 dias
  const apolicesVencendo30 = await ApoliceModel.find({
    status: { $in: ['ativa', 'vencendo'] },
    dataVencimento: { $gte: hoje, $lte: em30Dias },
    alertaVencimentoEnviado: { $ne: true }
  }).populate('vendedorId');
  
  // Busca apólices vencendo em 7 dias (urgente)
  const apolicesVencendo7 = await ApoliceModel.find({
    status: { $in: ['ativa', 'vencendo'] },
    dataVencimento: { $gte: hoje, $lte: em7Dias }
  }).populate('vendedorId');
  
  // Busca admins e financeiros para alertas
  const gestores = await UserModel.find({
    role: { $in: ['admin', 'financeiro'] },
    active: true
  });
  
  const alertsCriados: Alert[] = [];
  
  // Alertas para 30 dias
  for (const apolice of apolicesVencendo30) {
    const diasRestantes = Math.ceil(
      (new Date(apolice.dataVencimento).getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    // Alerta para o vendedor responsável
    if (apolice.vendedorId) {
      const alert = await createAlert({
        type: 'apolice_vencendo',
        title: 'Apólice próxima do vencimento',
        message: `A apólice ${apolice.numeroApolice} de ${apolice.empresaNome} vence em ${diasRestantes} dias.`,
        priority: diasRestantes <= 7 ? 'urgente' : 'alta',
        userId: apolice.vendedorId._id as Types.ObjectId,
        apoliceId: apolice._id as Types.ObjectId,
        actionUrl: `/apolices/${apolice._id}`,
        actionLabel: 'Ver Apólice'
      });
      alertsCriados.push(alert);
    }
    
    // Alerta para gestores (admin/financeiro)
    for (const gestor of gestores) {
      const alert = await createAlert({
        type: 'apolice_vencendo',
        title: 'Apólice próxima do vencimento',
        message: `A apólice ${apolice.numeroApolice} de ${apolice.empresaNome} vence em ${diasRestantes} dias.`,
        priority: diasRestantes <= 7 ? 'alta' : 'media',
        userId: gestor._id as Types.ObjectId,
        apoliceId: apolice._id as Types.ObjectId,
        actionUrl: `/apolices/${apolice._id}`,
        actionLabel: 'Ver Apólice'
      });
      alertsCriados.push(alert);
    }
    
    // Marca como notificado
    apolice.alertaVencimentoEnviado = true;
    await apolice.save();
  }
  
  return {
    alertasCriados: alertsCriados.length,
    apolicesProcessadas: apolicesVencendo30.length
  };
}

/**
 * Gera alertas para leads que precisam de contato
 * Deve ser chamado por um cron job diariamente
 */
export async function generateLeadAlerts() {
  const hoje = new Date();
  
  // Leads com próximo contato para hoje
  const leadsHoje = await LeadModel.find({
    proximoContato: {
      $gte: new Date(hoje.setHours(0, 0, 0, 0)),
      $lte: new Date(hoje.setHours(23, 59, 59, 999))
    },
    qualificationStatus: { $nin: ['fechado_ganho', 'fechado_perdido', 'sem_interesse'] }
  }).populate('owners');
  
  // Leads sem contato há mais de 7 dias
  const seteDiasAtras = new Date();
  seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);
  
  const leadsSemContato = await LeadModel.find({
    lastContactAt: { $lt: seteDiasAtras },
    qualificationStatus: { $nin: ['fechado_ganho', 'fechado_perdido', 'sem_interesse'] }
  }).populate('owners');
  
  const alertsCriados: Alert[] = [];
  
  // Alertas de próximo contato
  for (const lead of leadsHoje) {
    for (const owner of (lead.owners || [])) {
      const alert = await createAlert({
        type: 'lead_proximo_contato',
        title: 'Contato agendado para hoje',
        message: `Você tem um contato agendado com ${lead.name}${lead.company ? ` (${lead.company})` : ''}.`,
        priority: 'alta',
        userId: owner._id as Types.ObjectId,
        leadId: lead._id as Types.ObjectId,
        actionUrl: `/leads/${lead._id}`,
        actionLabel: 'Ver Lead',
        metadata: { lembreteContato: lead.lembreteContato }
      });
      alertsCriados.push(alert);
    }
  }
  
  // Alertas de leads sem contato
  for (const lead of leadsSemContato) {
    for (const owner of (lead.owners || [])) {
      const alert = await createAlert({
        type: 'lead_sem_contato',
        title: 'Lead sem contato recente',
        message: `O lead ${lead.name} está há mais de 7 dias sem contato.`,
        priority: 'media',
        userId: owner._id as Types.ObjectId,
        leadId: lead._id as Types.ObjectId,
        actionUrl: `/leads/${lead._id}`,
        actionLabel: 'Ver Lead'
      });
      alertsCriados.push(alert);
    }
  }
  
  return {
    alertasCriados: alertsCriados.length,
    leadsProximoContato: leadsHoje.length,
    leadsSemContato: leadsSemContato.length
  };
}

/**
 * Limpa alertas antigos (mais de 30 dias e resolvidos/ignorados)
 */
export async function cleanupOldAlerts() {
  const trintaDiasAtras = new Date();
  trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30);
  
  const result = await AlertModel.deleteMany({
    status: { $in: ['resolvido', 'ignorado'] },
    updatedAt: { $lt: trintaDiasAtras }
  });
  
  return { deletados: result.deletedCount };
}
