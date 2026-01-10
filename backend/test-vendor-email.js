import { Resend } from 'resend';
import crypto from 'crypto';

const resend = new Resend('re_6bXGauEP_JvJWZ5SJaW9NteZJdEwn32Bp');

async function testVendorEmail() {
  try {
    console.log('🧪 Testando envio de email para novo vendedor...\n');
    
    const userEmail = 'felipe.coqueiro@usp.br';
    const userName = 'Teste Vendedor';
    const token = crypto.randomBytes(32).toString('hex');
    const resetLink = `https://nautiluzcrm.com.br/redefinir-senha?token=${token}`;
    
    console.log('📧 Para:', userEmail);
    console.log('👤 Nome:', userName);
    console.log('🔗 Link:', resetLink);
    console.log('');
    
    const { data, error } = await resend.emails.send({
      from: 'Nautiluz CRM <onboarding@nautiluzcrm.com.br>',
      to: [userEmail],
      subject: 'Bem-vindo ao Nautiluz CRM - Defina sua senha',
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Bem-vindo ao Nautiluz CRM!</h2>
          <p>Sua conta foi criada com sucesso!</p>
          <p>Para definir sua senha, clique no botão abaixo:</p>
          <a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px;">
            Definir Minha Senha
          </a>
          <p style="color: #666; margin-top: 20px;">Este link expira em 24 horas.</p>
        </body>
        </html>
      `
    });

    if (error) {
      console.error('❌ Erro Resend:', error);
      process.exit(1);
    }

    console.log('✅ Email enviado com sucesso!');
    console.log('📧 ID:', data.id);
    console.log('');
    console.log('🎉 Verifique a caixa de entrada de:', userEmail);
    process.exit(0);
  } catch (err) {
    console.error('❌ Erro:', err.message);
    process.exit(1);
  }
}

testVendorEmail();
