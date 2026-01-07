import { Resend } from 'resend';
import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';

export class ResendEmailService {
  private resend: Resend;
  private fromEmail: string;

  constructor() {
    if (!env.RESEND_API_KEY) {
      logger.warn('RESEND_API_KEY não configurada. Emails não serão enviados.');
    }

    this.resend = new Resend(env.RESEND_API_KEY || 're_dummy_key');
    this.fromEmail = env.EMAIL_FROM || 'Nautiluz CRM <noreply@nautiluz.com>';
  }

  /**
   * Envia email de boas-vindas para novo usuário
   */
  async sendWelcomeEmail(to: string, userName: string, temporaryPassword: string) {
    if (!env.RESEND_API_KEY) {
      logger.info(`[EMAIL MOCK] Boas-vindas para ${to}`);
      return;
    }

    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to,
        subject: 'Bem-vindo ao Nautiluz CRM',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #1a1a1a;">Bem-vindo ao Nautiluz CRM!</h1>
            <p>Olá <strong>${userName}</strong>,</p>
            <p>Sua conta foi criada com sucesso. Use as credenciais abaixo para fazer login:</p>
            <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>Email:</strong> ${to}</p>
              <p style="margin: 5px 0;"><strong>Senha Temporária:</strong> ${temporaryPassword}</p>
            </div>
            <p>Por segurança, altere sua senha no primeiro acesso.</p>
            <p style="margin-top: 30px;">
              <a href="${env.FRONTEND_URL || 'http://localhost:5173'}/login" 
                 style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Acessar CRM
              </a>
            </p>
            <p style="color: #666; font-size: 12px; margin-top: 30px;">
              Nautiluz CRM - Sistema de Gestão de Relacionamento com Clientes
            </p>
          </div>
        `,
      });

      logger.info(`Email de boas-vindas enviado para ${to}`);
    } catch (error) {
      logger.error({ err: error, to }, 'Erro ao enviar email de boas-vindas');
      throw error;
    }
  }

  /**
   * Envia email de reset de senha
   */
  async sendPasswordResetEmail(to: string, userName: string, resetToken: string) {
    if (!env.RESEND_API_KEY) {
      logger.info(`[EMAIL MOCK] Reset de senha para ${to}, token: ${resetToken}`);
      return;
    }

    const resetUrl = `${env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to,
        subject: 'Recuperação de Senha - Nautiluz CRM',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #1a1a1a;">Recuperação de Senha</h1>
            <p>Olá <strong>${userName}</strong>,</p>
            <p>Recebemos uma solicitação para redefinir sua senha.</p>
            <p>Clique no botão abaixo para criar uma nova senha:</p>
            <p style="margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Redefinir Senha
              </a>
            </p>
            <p style="color: #666; font-size: 14px;">
              Ou copie e cole este link no navegador:<br>
              <a href="${resetUrl}" style="color: #2563eb; word-break: break-all;">${resetUrl}</a>
            </p>
            <p style="color: #666; font-size: 12px; margin-top: 30px;">
              Este link expira em 1 hora.<br>
              Se você não solicitou esta redefinição, ignore este email.
            </p>
          </div>
        `,
      });

      logger.info(`Email de reset de senha enviado para ${to}`);
    } catch (error) {
      logger.error({ err: error, to }, 'Erro ao enviar email de reset');
      throw error;
    }
  }

  /**
   * Envia notificação de novo lead por email
   */
  async sendNewLeadNotification(to: string, userName: string, leadName: string, leadId: string) {
    if (!env.RESEND_API_KEY) {
      logger.info(`[EMAIL MOCK] Novo lead para ${to}: ${leadName}`);
      return;
    }

    const leadUrl = `${env.FRONTEND_URL || 'http://localhost:5173'}/leads/${leadId}`;

    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to,
        subject: `Novo Lead Atribuído: ${leadName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #1a1a1a;">Novo Lead Atribuído</h1>
            <p>Olá <strong>${userName}</strong>,</p>
            <p>Um novo lead foi atribuído a você:</p>
            <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 5px 0; font-size: 18px;"><strong>${leadName}</strong></p>
            </div>
            <p style="margin-top: 30px;">
              <a href="${leadUrl}" 
                 style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Ver Detalhes do Lead
              </a>
            </p>
            <p style="color: #666; font-size: 12px; margin-top: 30px;">
              Nautiluz CRM - Sistema de Gestão de Relacionamento com Clientes
            </p>
          </div>
        `,
      });

      logger.info(`Email de novo lead enviado para ${to}`);
    } catch (error) {
      logger.error({ err: error, to, leadName }, 'Erro ao enviar email de novo lead');
      throw error;
    }
  }

  /**
   * Envia alerta de SLA próximo do vencimento
   */
  async sendSLAWarningEmail(
    to: string,
    userName: string,
    leadName: string,
    hoursRemaining: number,
    leadId: string
  ) {
    if (!env.RESEND_API_KEY) {
      logger.info(`[EMAIL MOCK] Alerta SLA para ${to}: ${leadName}`);
      return;
    }

    const leadUrl = `${env.FRONTEND_URL || 'http://localhost:5173'}/leads/${leadId}`;

    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to,
        subject: `⚠️ SLA Próximo do Vencimento: ${leadName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #dc2626;">⚠️ Atenção: SLA Próximo do Vencimento</h1>
            <p>Olá <strong>${userName}</strong>,</p>
            <p>O lead <strong>${leadName}</strong> tem apenas <strong>${hoursRemaining} hora(s)</strong> restantes no SLA.</p>
            <p>Por favor, tome as ações necessárias o quanto antes.</p>
            <p style="margin-top: 30px;">
              <a href="${leadUrl}" 
                 style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Visualizar Lead Agora
              </a>
            </p>
            <p style="color: #666; font-size: 12px; margin-top: 30px;">
              Nautiluz CRM - Sistema de Gestão de Relacionamento com Clientes
            </p>
          </div>
        `,
      });

      logger.info(`Email de alerta SLA enviado para ${to}`);
    } catch (error) {
      logger.error({ err: error, to, leadName }, 'Erro ao enviar email de alerta SLA');
      throw error;
    }
  }

  /**
   * Envia email customizado
   */
  async sendCustomEmail(to: string, subject: string, html: string) {
    if (!env.RESEND_API_KEY) {
      logger.info(`[EMAIL MOCK] Email customizado para ${to}: ${subject}`);
      return;
    }

    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to,
        subject,
        html,
      });

      logger.info(`Email customizado enviado para ${to}`);
    } catch (error) {
      logger.error({ err: error, to, subject }, 'Erro ao enviar email customizado');
      throw error;
    }
  }
}
