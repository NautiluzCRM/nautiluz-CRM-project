import { NotificationsService } from '../modules/notifications/notifications.service.js';
import { ResendEmailService } from '../modules/notifications/resend.service.js';
import { logger } from '../config/logger.js';

/**
 * Script de exemplo para testar o sistema de notificações
 * 
 * Para executar:
 * 1. Certifique-se de que o MongoDB está rodando
 * 2. Compile o TypeScript: npx tsc
 * 3. Execute: node dist/scripts/test-notifications.js <userId>
 */

const notificationsService = new NotificationsService();
const emailService = new ResendEmailService();

async function testNotifications(userId: string) {
  try {
    logger.info(`Criando notificações de teste para usuário ${userId}`);

    // 1. Notificação de boas-vindas
    const notification1 = await notificationsService.createNotification({
      userId,
      title: 'Bem-vindo ao Sistema',
      message: 'Sua conta foi configurada com sucesso! Explore todas as funcionalidades do CRM.',
      type: 'success',
    });
    logger.info(`Notificação criada: ${notification1._id}`);

    // 2. Notificação de novo lead
    const notification2 = await notificationsService.notifyNewLeadAssigned(
      userId,
      'João Silva - Empresa XYZ',
      '507f1f77bcf86cd799439011'
    );
    logger.info(`Notificação de lead criada: ${notification2._id}`);

    // 3. Notificação de SLA
    const notification3 = await notificationsService.notifySLAWarning(
      userId,
      'Maria Santos - ABC Ltda',
      4,
      '507f1f77bcf86cd799439012'
    );
    logger.info(`Notificação de SLA criada: ${notification3._id}`);

    // 4. Notificação de mudança de etapa
    const notification4 = await notificationsService.notifyLeadStageChanged(
      userId,
      'Carlos Costa - Tech Corp',
      'Proposta',
      '507f1f77bcf86cd799439013'
    );
    logger.info(`Notificação de mudança de etapa criada: ${notification4._id}`);

    // 5. Notificação de sistema
    const notification5 = await notificationsService.createNotification({
      userId,
      title: 'Atualização do Sistema',
      message: 'Uma nova versão do CRM foi instalada com melhorias de performance.',
      type: 'system',
    });
    logger.info(`Notificação de sistema criada: ${notification5._id}`);

    // Buscar todas as notificações
    const allNotifications = await notificationsService.getNotifications(userId);
    logger.info(`Total de notificações: ${allNotifications.length}`);

    // Contar não lidas
    const unreadCount = await notificationsService.getUnreadCount(userId);
    logger.info(`Notificações não lidas: ${unreadCount}`);

    logger.info('✓ Teste de notificações concluído com sucesso!');
    process.exit(0);
  } catch (error) {
    logger.error({ err: error }, 'Erro ao criar notificações de teste');
    process.exit(1);
  }
}

// Executar o script
const userId = process.argv[2];

if (!userId) {
  console.error('Uso: node dist/scripts/test-notifications.js <userId>');
  console.error('Exemplo: node dist/scripts/test-notifications.js 507f1f77bcf86cd799439011');
  process.exit(1);
}

// Aguardar conexão com banco antes de executar
setTimeout(() => {
  testNotifications(userId);
}, 2000);
