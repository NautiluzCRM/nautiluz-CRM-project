import { Resend } from 'resend';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

const resend = new Resend(env.RESEND_API_KEY);

interface SendPasswordResetEmailParams {
  to: string;
  userName: string;
  resetLink: string;
  isNewUser?: boolean;
}

export async function sendPasswordResetEmail({ to, userName, resetLink, isNewUser = false }: SendPasswordResetEmailParams) {
  const subject = isNewUser 
    ? 'Bem-vindo ao Nautiluz CRM - Defina sua senha' 
    : 'Recuperação de Senha - Nautiluz CRM';
  
  const greeting = isNewUser
    ? 'Bem-vindo(a) ao Nautiluz CRM!'
    : `Olá, ${userName}!`;
  
  const message = isNewUser
    ? 'Sua conta foi criada com sucesso! Para começar a usar o sistema, você precisa definir uma senha.'
    : 'Recebemos uma solicitação para redefinir a senha da sua conta no Nautiluz CRM.';
  
  const buttonText = isNewUser
    ? 'Definir Minha Senha'
    : 'Redefinir Senha';
  
  const expirationTime = isNewUser ? '24 horas' : '1 hora';
  
  try {
    const { data, error } = await resend.emails.send({
      from: env.RESEND_FROM_EMAIL,
      to: [to],
      subject,
      html: `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <!-- Header -->
            <tr>
              <td style="padding: 40px 30px; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">
                  🚀 NAUTILUZ CRM
                </h1>
              </td>
            </tr>
            
            <!-- Content -->
            <tr>
              <td style="padding: 40px 30px;">
                <h2 style="color: #1e293b; margin: 0 0 20px; font-size: 24px;">
                  ${greeting}
                </h2>
                <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                  ${message}
                </p>
                <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
                  Clique no botão abaixo para ${isNewUser ? 'definir' : 'criar'} uma nova senha:
                </p>
                
                <!-- Button -->
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin: 0 auto;">
                  <tr>
                    <td style="border-radius: 8px; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);">
                      <a href="${resetLink}" target="_blank" style="display: inline-block; padding: 16px 40px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600;">
                        ${buttonText}
                      </a>
                    </td>
                  </tr>
                </table>
                
                <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 30px 0 0; text-align: center;">
                  Este link expira em <strong>${expirationTime}</strong>.
                </p>
                
                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
                
                <p style="color: #94a3b8; font-size: 13px; line-height: 1.6; margin: 0;">
                  ${isNewUser 
                    ? 'Se você não esperava receber este email, entre em contato com o administrador do sistema.' 
                    : 'Se você não solicitou a redefinição de senha, ignore este email. Sua conta permanecerá segura.'}
                </p>
                
                <p style="color: #94a3b8; font-size: 12px; line-height: 1.6; margin: 20px 0 0;">
                  Caso o botão não funcione, copie e cole este link no seu navegador:<br>
                  <a href="${resetLink}" style="color: #3b82f6; word-break: break-all;">${resetLink}</a>
                </p>
              </td>
            </tr>
            
            <!-- Footer -->
            <tr>
              <td style="padding: 30px; background-color: #f8fafc; text-align: center;">
                <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                  © ${new Date().getFullYear()} Nautiluz CRM - Todos os direitos reservados
                </p>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `
    });

    if (error) {
      logger.error({ error }, 'Failed to send password reset email');
      throw new Error('Falha ao enviar email de recuperação');
    }

    logger.info({ emailId: data?.id, to }, 'Password reset email sent');
    return data;
  } catch (err) {
    logger.error({ err, to }, 'Error sending password reset email');
    throw err;
  }
}
