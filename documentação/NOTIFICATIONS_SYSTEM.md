# Sistema de Notificações e Emails - Nautiluz CRM

## ✅ Funcionalidades Implementadas

### Backend

1. **Modelo de Notificação** (`Notification.model.ts`)
   - MongoDB schema com campos: userId, title, message, type, read, link, metadata
   - Tipos de notificação: info, success, warning, error, lead, system
   - Índices otimizados para consultas rápidas

2. **Serviço de Notificações** (`notifications.service.ts`)
   - `createNotification()` - Cria notificações customizadas
   - `getNotifications()` - Lista notificações (com filtro de não lidas)
   - `getUnreadCount()` - Conta notificações não lidas
   - `markAsRead()` - Marca como lida
   - `markAllAsRead()` - Marca todas como lidas
   - `deleteNotification()` - Remove notificação
   - Helpers especializados: `notifyNewLeadAssigned()`, `notifyLeadStageChanged()`, `notifySLAWarning()`

3. **Serviço de Email com Resend** (`resend.service.ts`)
   - `sendWelcomeEmail()` - Email de boas-vindas
   - `sendPasswordResetEmail()` - Recuperação de senha
   - `sendNewLeadNotification()` - Notificação de novo lead
   - `sendSLAWarningEmail()` - Alerta de SLA próximo do vencimento
   - `sendCustomEmail()` - Emails personalizados
   - Templates HTML responsivos e profissionais

4. **Rotas da API** (`notifications.routes.ts`)
   - `GET /api/notifications` - Lista notificações
   - `GET /api/notifications/unread-count` - Contagem de não lidas
   - `PATCH /api/notifications/:id/read` - Marca como lida
   - `PATCH /api/notifications/mark-all-read` - Marca todas como lidas
   - `DELETE /api/notifications/:id` - Deleta notificação
   - `DELETE /api/notifications/clear-read` - Limpa todas lidas

### Frontend

1. **Header Atualizado** (`Header.tsx`)
   - Dropdown de notificações em tempo real
   - Badge com contador de não lidas
   - Lista scrollável de notificações
   - Formatação de data relativa (ex: "há 5 minutos")
   - Ícones e cores por tipo de notificação
   - Ações: marcar como lida, deletar, marcar todas como lidas
   - Auto-atualização a cada 30 segundos
   - Navegação por link (se a notificação tiver)

2. **API Client** (`api.ts`)
   - `fetchNotifications()` - Busca notificações
   - `fetchUnreadCount()` - Conta não lidas
   - `markNotificationAsRead()` - Marca como lida
   - `markAllNotificationsAsRead()` - Marca todas
   - `deleteNotification()` - Remove notificação
   - `clearReadNotifications()` - Limpa lidas

## 🚀 Como Usar

### Configuração

1. **Instalar dependências** (já instalado):
   ```bash
   # Backend
   cd backend
   npm install resend
   
   # Frontend
   cd frontend
   npm install date-fns
   ```

2. **Configurar variáveis de ambiente** (`.env`):
   ```env
   # Obter em: https://resend.com/api-keys
   RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxx
   
   # Email remetente (deve ser verificado no Resend)
   EMAIL_FROM=Nautiluz CRM <noreply@seudominio.com>
   
   # URL do frontend
   FRONTEND_URL=http://localhost:5173
   ```

3. **Verificar domínio no Resend**:
   - Acesse https://resend.com/domains
   - Adicione seu domínio e configure DNS
   - Ou use `onboarding@resend.dev` para testes

### Testando Notificações

```bash
# 1. Compilar o TypeScript
cd backend
npx tsc

# 2. Executar script de teste (substitua pelo ID de um usuário real)
node dist/scripts/test-notifications.js 507f1f77bcf86cd799439011
```

### Criando Notificações no Código

```typescript
import { NotificationsService } from './modules/notifications/notifications.service';

const notificationsService = new NotificationsService();

// Notificação simples
await notificationsService.createNotification({
  userId: '507f1f77bcf86cd799439011',
  title: 'Título da Notificação',
  message: 'Mensagem detalhada aqui...',
  type: 'info', // info, success, warning, error, lead, system
  link: '/leads/123', // opcional
});

// Notificação de novo lead
await notificationsService.notifyNewLeadAssigned(
  userId,
  'Nome do Lead',
  leadId
);

// Notificação de SLA
await notificationsService.notifySLAWarning(
  userId,
  'Nome do Lead',
  horasRestantes,
  leadId
);
```

### Enviando Emails

```typescript
import { ResendEmailService } from './modules/notifications/resend.service';

const emailService = new ResendEmailService();

// Email de boas-vindas
await emailService.sendWelcomeEmail(
  'usuario@email.com',
  'Nome do Usuário',
  'senha123'
);

// Email de reset de senha
await emailService.sendPasswordResetEmail(
  'usuario@email.com',
  'Nome do Usuário',
  'tokenDeReset'
);

// Email de novo lead
await emailService.sendNewLeadNotification(
  'usuario@email.com',
  'Nome do Usuário',
  'Nome do Lead',
  'leadId123'
);
```

## 📱 Interface no Frontend

### Notificações no Header

- **Badge vermelho** mostra número de não lidas
- **Clique no sino** abre dropdown com lista
- **Clique na notificação** marca como lida e navega para o link
- **Botão "X"** remove notificação individual
- **Botão "Marcar todas"** marca todas como lidas
- **Ponto azul** indica notificações não lidas
- **Formatação inteligente** de tempo ("há 5 minutos", "há 2 horas")

### Tipos de Notificação

| Tipo | Ícone | Cor | Uso |
|------|-------|-----|-----|
| `info` | ℹ | Azul | Informações gerais |
| `success` | ✓ | Verde | Ações bem-sucedidas |
| `warning` | ⚠ | Amarelo | Alertas importantes |
| `error` | ✕ | Vermelho | Erros e falhas |
| `lead` | 👤 | Azul | Relacionado a leads |
| `system` | ⚙ | Cinza | Atualizações do sistema |

## 🔐 Segurança

- Todas as rotas requerem autenticação JWT
- Usuário só acessa suas próprias notificações
- Rate limiting configurado no servidor
- Validação de dados com Zod

## 🎨 Personalização

### Mudar Templates de Email

Edite os templates HTML em `resend.service.ts`. Cada função de email tem seu próprio template responsivo.

### Adicionar Novos Tipos de Notificação

1. Adicionar tipo no schema: `Notification.model.ts`
2. Criar helper no serviço: `notifications.service.ts`
3. Adicionar ícone e cor: `Header.tsx` (funções `getNotificationIcon` e `getNotificationColor`)

## 📊 Monitoramento

### Verificar Envios no Resend

- Dashboard: https://resend.com/emails
- Logs de envio, bounces, aberturas
- Estatísticas de entrega

### Logs do Backend

```bash
# Ver logs em tempo real
cd backend
npm start

# Buscar erros de email
grep "Erro ao enviar email" logs/*.log
```

## 🐛 Troubleshooting

### Notificações não aparecem

1. Verificar se backend está rodando
2. Verificar se MongoDB está conectado
3. Checar console do navegador para erros de API
4. Verificar se usuário está autenticado

### Emails não estão sendo enviados

1. Verificar `RESEND_API_KEY` no `.env`
2. Verificar domínio verificado no Resend
3. Checar logs do backend para erros
4. Verificar quota da conta Resend

### Notificações não atualizam

1. Verificar intervalo de 30s do `useEffect`
2. Recarregar a página (F5)
3. Limpar cache do navegador
4. Verificar conexão com API

## 📝 Próximas Melhorias

- [ ] Notificações em tempo real com WebSocket/Server-Sent Events
- [ ] Preferências de notificação por usuário
- [ ] Agrupamento de notificações similares
- [ ] Push notifications no navegador
- [ ] Filtros avançados de notificações
- [ ] Estatísticas de engajamento com emails
- [ ] Templates de email personalizáveis via UI
- [ ] Notificações por SMS/WhatsApp

## 🎉 Conclusão

O sistema de notificações está totalmente funcional e pronto para uso! Os usuários agora receberão notificações em tempo real no header e podem receber emails automáticos para eventos importantes do CRM.
