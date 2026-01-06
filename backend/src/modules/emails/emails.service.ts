import { EmailModel, Email, EmailType, EmailStatus } from './email.model.js';
import { LeadModel } from '../leads/lead.model.js';
import { ApoliceModel } from '../apolices/apolice.model.js';
import { UserModel } from '../users/user.model.js';
import { ActivityModel } from '../leads/activity.model.js';
import { AppError } from '../../common/http.js';
import { StatusCodes } from 'http-status-codes';
import { Resend } from 'resend';

interface UserAuth {
  sub: string;
  role: string;
}

interface EmailFilter {
  status?: EmailStatus | 'all';
  type?: EmailType | 'all';
  leadId?: string;
  apoliceId?: string;
  sentBy?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

interface SendEmailInput {
  to: string;
  toName?: string;
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  htmlBody?: string;
  attachments?: {
    filename: string;
    url: string;
    mimeType: string;
    size: number;
  }[];
  type: EmailType;
  leadId?: string;
  apoliceId?: string;
  templateId?: string;
  templateData?: Record<string, any>;
}

/**
 * Configuração do cliente de email usando Resend
 * Configure RESEND_API_KEY no ambiente
 */
function getEmailClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  
  if (!apiKey) {
    console.warn('⚠️ RESEND_API_KEY não configurada. Emails não serão enviados.');
    return null;
  }
  
  return new Resend(apiKey);
}

/**
 * Lista emails com filtros
 */
export async function listEmails(filter: EmailFilter = {}, user?: UserAuth) {
  const query: any = {};
  
  // Vendedor só vê emails que ele enviou
  if (user?.role === 'vendedor') {
    query.sentBy = user.sub;
  }
  
  if (filter.status && filter.status !== 'all') {
    query.status = filter.status;
  }
  
  if (filter.type && filter.type !== 'all') {
    query.type = filter.type;
  }
  
  if (filter.leadId) {
    query.leadId = filter.leadId;
  }
  
  if (filter.apoliceId) {
    query.apoliceId = filter.apoliceId;
  }
  
  if (filter.sentBy && user?.role !== 'vendedor') {
    query.sentBy = filter.sentBy;
  }
  
  if (filter.search) {
    query.$or = [
      { to: { $regex: filter.search, $options: 'i' } },
      { subject: { $regex: filter.search, $options: 'i' } },
      { toName: { $regex: filter.search, $options: 'i' } }
    ];
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
  
  return EmailModel.find(query)
    .sort({ createdAt: -1 })
    .populate('leadId', 'name company')
    .populate('apoliceId', 'numeroApolice empresaNome')
    .populate('sentBy', 'name email')
    .limit(100);
}

/**
 * Obtém um email por ID
 */
export async function getEmail(id: string, user?: UserAuth) {
  const email = await EmailModel.findById(id)
    .populate('leadId', 'name company email phone')
    .populate('apoliceId', 'numeroApolice empresaNome')
    .populate('sentBy', 'name email');
  
  if (!email) {
    throw new AppError('Email não encontrado', StatusCodes.NOT_FOUND);
  }
  
  // Vendedor só pode ver emails que enviou
  if (user?.role === 'vendedor' && email.sentBy?.toString() !== user.sub) {
    throw new AppError('Acesso negado', StatusCodes.FORBIDDEN);
  }
  
  return email;
}

/**
 * Envia um email
 */
export async function sendEmail(input: SendEmailInput, user?: UserAuth): Promise<Email> {
  // Valida lead se informado
  if (input.leadId) {
    const lead = await LeadModel.findById(input.leadId);
    if (!lead) {
      throw new AppError('Lead não encontrado', StatusCodes.BAD_REQUEST);
    }
  }
  
  // Valida apólice se informada
  if (input.apoliceId) {
    const apolice = await ApoliceModel.findById(input.apoliceId);
    if (!apolice) {
      throw new AppError('Apólice não encontrada', StatusCodes.BAD_REQUEST);
    }
  }
  
  // Cria registro do email
  const emailRecord = await EmailModel.create({
    ...input,
    status: 'pendente',
    sentBy: user?.sub
  });
  
  // Tenta enviar o email usando Resend
  const resend = getEmailClient();
  
  if (!resend) {
    // Se não há cliente configurado, apenas salva o registro
    emailRecord.status = 'pendente';
    emailRecord.errorMessage = 'RESEND_API_KEY não configurada';
    await emailRecord.save();
    return emailRecord;
  }
  
  try {
    // Prepara anexos para Resend
    const attachments = input.attachments?.map(att => ({
      filename: att.filename,
      path: att.url
    })) || [];
    
    // Envia o email via Resend
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM || 'Nautiluz CRM <noreply@nautiluz.com.br>',
      to: [input.to],
      cc: input.cc,
      bcc: input.bcc,
      subject: input.subject,
      text: input.body,
      html: input.htmlBody || input.body,
      attachments
    });
    
    if (error) {
      throw new Error(error.message);
    }
    
    // Atualiza status para enviado
    emailRecord.status = 'enviado';
    emailRecord.sentAt = new Date();
    emailRecord.messageId = data?.id;
    await emailRecord.save();
    
    // Registra atividade no lead se vinculado
    if (input.leadId) {
      await ActivityModel.create({
        leadId: input.leadId,
        type: 'Email',
        descricao: `Email enviado: ${input.subject}`,
        payload: { emailId: emailRecord._id, to: input.to },
        usuario: user?.sub || 'Sistema',
        data: new Date()
      });
    }
    
    return emailRecord;
    
  } catch (error: any) {
    // Registra falha
    emailRecord.status = 'falhou';
    emailRecord.errorMessage = error.message || 'Erro ao enviar email';
    emailRecord.retryCount = (emailRecord.retryCount || 0) + 1;
    await emailRecord.save();
    
    throw new AppError(`Erro ao enviar email: ${error.message}`, StatusCodes.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Reenvia um email que falhou
 */
export async function resendEmail(id: string, user?: UserAuth) {
  const email = await EmailModel.findById(id);
  
  if (!email) {
    throw new AppError('Email não encontrado', StatusCodes.NOT_FOUND);
  }
  
  if (email.status === 'enviado') {
    throw new AppError('Email já foi enviado com sucesso', StatusCodes.BAD_REQUEST);
  }
  
  // Reenvia
  return sendEmail({
    to: email.to,
    toName: email.toName,
    cc: email.cc,
    bcc: email.bcc,
    subject: email.subject,
    body: email.body,
    htmlBody: email.htmlBody,
    attachments: email.attachments,
    type: email.type,
    leadId: email.leadId?.toString(),
    apoliceId: email.apoliceId?.toString()
  }, user);
}

/**
 * Obtém estatísticas de emails
 */
export async function getEmailStats(user?: UserAuth) {
  const matchStage: any = {};
  
  if (user?.role === 'vendedor') {
    matchStage.sentBy = user.sub;
  }
  
  const stats = await EmailModel.aggregate([
    { $match: matchStage },
    {
      $facet: {
        porStatus: [
          { $group: { _id: '$status', count: { $sum: 1 } } }
        ],
        porTipo: [
          { $group: { _id: '$type', count: { $sum: 1 } } }
        ],
        ultimosDias: [
          {
            $match: {
              createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
            }
          },
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
              count: { $sum: 1 }
            }
          },
          { $sort: { _id: 1 } }
        ],
        totais: [
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              enviados: {
                $sum: { $cond: [{ $eq: ['$status', 'enviado'] }, 1, 0] }
              },
              falhou: {
                $sum: { $cond: [{ $eq: ['$status', 'falhou'] }, 1, 0] }
              },
              abertos: {
                $sum: { $cond: ['$opened', 1, 0] }
              }
            }
          }
        ]
      }
    }
  ]);
  
  return {
    porStatus: stats[0].porStatus,
    porTipo: stats[0].porTipo,
    ultimosDias: stats[0].ultimosDias,
    totais: stats[0].totais[0] || { total: 0, enviados: 0, falhou: 0, abertos: 0 }
  };
}

/**
 * Obtém histórico de emails de um lead
 */
export async function getEmailsByLead(leadId: string, user?: UserAuth) {
  const query: any = { leadId };
  
  if (user?.role === 'vendedor') {
    query.sentBy = user.sub;
  }
  
  return EmailModel.find(query)
    .sort({ createdAt: -1 })
    .populate('sentBy', 'name email');
}

/**
 * Marca email como aberto (para tracking)
 */
export async function markEmailAsOpened(messageId: string) {
  return EmailModel.findOneAndUpdate(
    { messageId, opened: false },
    { opened: true, openedAt: new Date() },
    { new: true }
  );
}

/**
 * Marca email como clicado (para tracking)
 */
export async function markEmailAsClicked(messageId: string) {
  return EmailModel.findOneAndUpdate(
    { messageId },
    { clicked: true, clickedAt: new Date() },
    { new: true }
  );
}

/**
 * Templates de email pré-definidos
 */
export const emailTemplates = {
  cotacao: {
    subject: 'Cotação de Plano de Saúde - {empresa}',
    body: `Olá {nome},

Segue em anexo a cotação de plano de saúde para {empresa}.

Ficamos à disposição para esclarecer qualquer dúvida.

Atenciosamente,
Equipe Nautiluz`
  },
  proposta: {
    subject: 'Proposta Comercial - {empresa}',
    body: `Olá {nome},

Conforme conversado, segue nossa proposta comercial em anexo.

Ficamos no aguardo do seu retorno.

Atenciosamente,
Equipe Nautiluz`
  },
  boasVindas: {
    subject: 'Bem-vindo à Nautiluz!',
    body: `Olá {nome},

Seja muito bem-vindo(a) à Nautiluz!

Estamos muito felizes em ter você conosco.

Atenciosamente,
Equipe Nautiluz`
  },
  renovacao: {
    subject: 'Lembrete: Renovação do Plano de Saúde - {empresa}',
    body: `Olá {nome},

Seu plano de saúde vence em {diasVencimento} dias.

Entre em contato conosco para renovar seu plano com as melhores condições.

Atenciosamente,
Equipe Nautiluz`
  }
};

/**
 * Processa template de email substituindo variáveis
 */
export function processEmailTemplate(
  templateId: keyof typeof emailTemplates,
  data: Record<string, string>
): { subject: string; body: string } {
  const template = emailTemplates[templateId];
  if (!template) {
    throw new AppError('Template não encontrado', StatusCodes.BAD_REQUEST);
  }
  
  let subject = template.subject;
  let body = template.body;
  
  Object.entries(data).forEach(([key, value]) => {
    const regex = new RegExp(`\\{${key}\\}`, 'g');
    subject = subject.replace(regex, value);
    body = body.replace(regex, value);
  });
  
  return { subject, body };
}
