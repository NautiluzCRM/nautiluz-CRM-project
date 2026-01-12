import { ResendEmailService } from '../modules/notifications/resend.service.js';
import { logger } from '../config/logger.js';

/**
 * Script para testar envio de email
 * 
 * Para executar:
 * 1. Compile: npx tsc
 * 2. Execute: node dist/scripts/test-email.js <email>
 */

const emailService = new ResendEmailService();

async function testEmail(toEmail: string) {
  try {
    logger.info(`Enviando email de teste para ${toEmail}`);
    console.log('\n🔍 Configurações:');
    console.log('- API Key:', process.env.RESEND_API_KEY ? '✓ Configurada' : '✗ Não configurada');
    console.log('- Email From:', process.env.RESEND_FROM_EMAIL || process.env.EMAIL_FROM || 'Nautiluz CRM <noreply@nautiluz.com>');
    console.log('- Para:', toEmail);
    console.log('\n📤 Enviando...\n');

    const result = await emailService.sendNewLeadNotification(
      toEmail,
      'Felipe Coqueiro',
      'Lead de Teste - Empresa XYZ Ltda',
      '507f1f77bcf86cd799439011'
    );

    console.log('\n✅ Email enviado com sucesso!');
    console.log('📧 Resultado da API:', result);
    console.log(`\n⚠️  IMPORTANTE: Verifique também a pasta de SPAM/LIXO ELETRÔNICO`);
    console.log(`📬 Destinatário: ${toEmail}`);
    logger.info('✓ Email de teste enviado com sucesso!');
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ ERRO ao enviar email:');
    console.error('Mensagem:', error.message);
    console.error('Detalhes completos:', JSON.stringify(error, null, 2));
    logger.error({ err: error }, 'Erro ao enviar email de teste');
    process.exit(1);
  }
}

// Executar o script
const toEmail = process.argv[2];

if (!toEmail) {
  console.error('Uso: node dist/scripts/test-email.js <email>');
  console.error('Exemplo: node dist/scripts/test-email.js felipe.coqueiro@usp.br');
  process.exit(1);
}

// Aguardar 1 segundo antes de executar
setTimeout(() => {
  testEmail(toEmail);
}, 1000);
