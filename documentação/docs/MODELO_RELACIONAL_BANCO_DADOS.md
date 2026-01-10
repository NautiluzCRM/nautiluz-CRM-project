# Modelo Relacional do Banco de Dados - Nautiluz CRM

**Sistema:** Nautiluz CRM  
**Banco de Dados:** MongoDB  
**Data:** 10 de janeiro de 2026  

---

## 📊 Visão Geral

O sistema utiliza MongoDB como banco de dados NoSQL, com 18 coleções principais organizadas por módulos funcionais. Apesar de ser NoSQL, o modelo possui relacionamentos bem definidos através de referências (ObjectId).

---

## 🗂️ Estrutura de Coleções

### **1. Users (Usuários)**
Gerenciamento de usuários do sistema com autenticação e controle de acesso.

```typescript
{
  _id: ObjectId,
  name: String,                    // Nome completo
  email: String (unique),          // Email (login)
  passwordHash: String,            // Senha criptografada (Argon2)
  role: Enum,                      // 'admin' | 'vendedor' | 'gerente'
  active: Boolean,                 // Status ativo/inativo
  
  // Perfil
  phone: String,
  jobTitle: String,
  emailSignature: String,
  photoUrl: String,
  lastLoginAt: Date,
  
  // Preferências de notificação
  notificationPreferences: {
    email: Boolean,
    sla: Boolean,
    sms: Boolean
  },
  
  // Preferências do sistema
  preferences: {
    darkMode: Boolean,
    autoSave: Boolean
  },
  
  // Configuração de distribuição automática de leads
  distribution: {
    active: Boolean,
    minLives: Number,              // Vidas mínimas para receber
    maxLives: Number,              // Vidas máximas para receber
    cnpjRule: Enum,                // 'required' | 'forbidden' | 'both'
    lastLeadReceivedAt: Date
  },
  
  createdAt: Date,
  updatedAt: Date
}
```

**Índices:**
- `email` (unique)
- `role, active`

**Relacionamentos:**
- **1:N** com `Leads` (owner, owners, createdBy, updatedBy)
- **1:N** com `Activities` (userId)
- **1:N** com `Notes` (userId)
- **1:N** com `Alerts` (userId, createdBy)
- **1:N** com `Integrations` (createdBy, defaultOwnerId)
- **1:N** com `Apolices` (vendedorId)

---

### **2. Leads (Leads/Oportunidades)**
Entidade central do CRM - representa potenciais clientes.

```typescript
{
  _id: ObjectId,
  
  // Dados básicos
  name: String,
  company: String,
  phone: String,
  phoneSecondary: String,
  whatsapp: String,
  email: String,
  emailSecondary: String,
  
  // Dados da empresa
  hasCnpj: Boolean,
  cnpj: String,
  cnpjType: Enum,                  // 'MEI' | 'EI' | 'ME' | 'EPP' | 'SLU' | 'LTDA' | etc.
  razaoSocial: String,
  nomeFantasia: String,
  
  // Vidas e faixas etárias
  livesCount: Number,
  faixasEtarias: {
    ate18: Number,
    de19a23: Number,
    de24a28: Number,
    de29a33: Number,
    de34a38: Number,
    de39a43: Number,
    de44a48: Number,
    de49a53: Number,
    de54a58: Number,
    acima59: Number
  },
  idades: [Number],                // Array legado
  
  // Plano atual
  hasCurrentPlan: Boolean,
  currentPlan: String,
  currentOperadora: String,
  dataVencimentoPlanoAtual: Date,
  
  // Valores
  avgPrice: Number,
  valorProposta: Number,
  valorFechado: Number,
  
  // Endereço
  address: {
    street: String,
    number: String,
    complement: String,
    neighborhood: String,
    city: String,
    state: String,
    zipCode: String
  },
  
  // Status e qualificação
  status: Enum,                    // 'ativo' | 'inativo' | 'convertido' | 'perdido'
  qualificationStatus: Enum,       // 'novo' | 'em_contato' | 'qualificado' | etc.
  qualificationScore: Number,      // 0-100 (sistema de pontuação)
  temperature: Enum,               // 'cold' | 'warm' | 'hot'
  priority: Enum,                  // 'baixa' | 'media' | 'alta' | 'urgente'
  
  // SLA e tracking
  enteredStageAt: Date,            // Quando entrou na etapa atual
  dueDate: Date,                   // Data limite para ação
  isOverdue: Boolean,              // Lead atrasado?
  overdueHours: Number,            // Horas de atraso
  
  // Timeline
  proximoContato: Date,
  ultimoContato: Date,
  lastInteractionAt: Date,
  createdAt: Date,
  updatedAt: Date,
  
  // Origem e contexto
  origin: Enum,                    // 'Meta Ads' | 'Google Ads' | 'Indicação' | etc.
  tags: [String],
  observacoes: String,
  motivoPerdido: String,
  
  // Pipeline e etapa
  pipelineId: ObjectId → Pipeline,
  stageId: ObjectId → Stage,
  rank: Number,                    // Posição no kanban
  
  // Responsáveis
  owner: ObjectId → User,
  owners: [ObjectId → User],
  
  // Referências
  apoliceId: ObjectId → Apolice,
  createdBy: ObjectId → User,
  updatedBy: ObjectId → User
}
```

**Índices:**
- `pipelineId, stageId, rank` (compound)
- `qualificationStatus, createdAt`
- `owners, qualificationStatus` (compound)
- `origin, createdAt` (compound)
- `proximoContato, qualificationStatus` (compound)

**Relacionamentos:**
- **N:1** com `Pipeline` (pipelineId)
- **N:1** com `Stage` (stageId)
- **N:1** com `User` (owner)
- **N:M** com `User` (owners[])
- **N:1** com `Apolice` (apoliceId)
- **1:N** com `Activities` (leadId)
- **1:N** com `Notes` (leadId)
- **1:N** com `Attachments` (leadId)
- **1:N** com `Alerts` (leadId)
- **1:N** com `Emails` (leadId)
- **1:N** com `Consents` (leadId)

---

### **3. Pipelines (Funis de Vendas)**
Representa diferentes funis/processos de vendas.

```typescript
{
  _id: ObjectId,
  name: String,                    // Nome do pipeline
  key: String (unique),            // Identificador único
  description: String,
  createdAt: Date,
  updatedAt: Date
}
```

**Índices:**
- `key` (unique)

**Relacionamentos:**
- **1:N** com `Stages` (pipelineId)
- **1:N** com `Leads` (pipelineId)

---

### **4. Stages (Etapas do Pipeline)**
Etapas/colunas do kanban dentro de cada pipeline.

```typescript
{
  _id: ObjectId,
  pipelineId: ObjectId → Pipeline,
  name: String,                    // Nome da etapa
  color: String,                   // Cor no kanban
  order: Number,                   // Ordem de exibição
  slaHours: Number,                // Tempo limite em horas
  isClosingStage: Boolean,         // Etapa de fechamento?
  createdAt: Date,
  updatedAt: Date
}
```

**Índices:**
- `pipelineId, order` (compound)

**Relacionamentos:**
- **N:1** com `Pipeline` (pipelineId)
- **1:N** com `Leads` (stageId)

---

### **5. Activities (Atividades)**
Registro de todas as ações realizadas em leads.

```typescript
{
  _id: ObjectId,
  leadId: ObjectId → Lead,
  type: Enum,                      // 'note' | 'call' | 'email' | 'meeting' | 
                                   // 'stage_change' | 'field_update' | etc.
  description: String,
  userId: ObjectId → User,
  
  // Detalhes específicos
  metadata: {
    field: String,                 // Para field_update
    oldValue: Mixed,
    newValue: Mixed,
    duration: Number,              // Para calls/meetings
    outcome: String
  },
  
  // Agendamento
  scheduledFor: Date,
  completedAt: Date,
  
  createdAt: Date,
  updatedAt: Date
}
```

**Índices:**
- `leadId, createdAt` (compound)
- `userId, type`
- `scheduledFor`

**Relacionamentos:**
- **N:1** com `Lead` (leadId)
- **N:1** com `User` (userId)

---

### **6. Notes (Notas)**
Notas e comentários sobre leads.

```typescript
{
  _id: ObjectId,
  leadId: ObjectId → Lead,
  content: String,
  userId: ObjectId → User,
  isPinned: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

**Índices:**
- `leadId, createdAt` (compound)

**Relacionamentos:**
- **N:1** com `Lead` (leadId)
- **N:1** com `User` (userId)

---

### **7. Attachments (Anexos)**
Arquivos anexados aos leads.

```typescript
{
  _id: ObjectId,
  leadId: ObjectId → Lead,
  filename: String,
  url: String,                     // URL no serviço de storage
  uploadedBy: ObjectId → User,
  createdAt: Date,
  updatedAt: Date
}
```

**Índices:**
- `leadId`

**Relacionamentos:**
- **N:1** com `Lead` (leadId)
- **N:1** com `User` (uploadedBy)

---

### **8. Apolices (Apólices)**
Contratos/apólices de seguro emitidas.

```typescript
{
  _id: ObjectId,
  
  // Identificação
  numeroApolice: String (unique),
  leadId: ObjectId → Lead,
  empresaNome: String,
  empresaCnpj: String,
  
  // Plano
  operadora: String,               // 'Unimed' | 'Bradesco' | 'SulAmérica' | etc.
  tipoPlano: String,               // 'enfermaria' | 'apartamento' | 'vip' | etc.
  nomePlano: String,
  coparticipacao: Boolean,
  
  // Datas importantes
  dataInicio: Date,
  dataVencimento: Date,
  dataRenovacao: Date,
  
  // Valores
  valorMensal: Number,
  valorTotal: Number,
  comissao: Number,
  percentualComissao: Number,
  
  // Titular
  titularNome: String,
  titularCpf: String,
  titularDataNascimento: Date,
  titularEmail: String,
  titularTelefone: String,
  
  // Vidas
  quantidadeVidas: Number,
  dependentes: [{
    nome: String,
    cpf: String,
    dataNascimento: Date,
    parentesco: String,
    inclusoEm: Date
  }],
  
  // Faixas etárias
  faixasEtarias: {
    ate18: Number,
    de19a23: Number,
    de24a28: Number,
    de29a33: Number,
    de34a38: Number,
    de39a43: Number,
    de44a48: Number,
    de49a53: Number,
    de54a58: Number,
    acima59: Number
  },
  
  // Status
  status: Enum,                    // 'ativa' | 'pendente' | 'vencendo' | 
                                   // 'vencida' | 'cancelada' | 'suspensa'
  motivoCancelamento: String,
  observacoes: String,
  
  // Responsável
  vendedorId: ObjectId → User,
  
  createdAt: Date,
  updatedAt: Date
}
```

**Índices:**
- `numeroApolice` (unique)
- `leadId`
- `status, dataVencimento` (compound)
- `vendedorId, status` (compound)

**Relacionamentos:**
- **N:1** com `Lead` (leadId)
- **N:1** com `User` (vendedorId)
- **1:N** com `Alerts` (apoliceId)
- **1:N** com `Emails` (apoliceId)

---

### **9. Alerts (Alertas)**
Sistema de alertas e notificações.

```typescript
{
  _id: ObjectId,
  
  // Tipo e conteúdo
  type: Enum,                      // 'apolice_vencendo' | 'lead_sem_contato' | 
                                   // 'meta_nao_atingida' | 'lembrete' | etc.
  title: String,
  message: String,
  priority: Enum,                  // 'baixa' | 'media' | 'alta' | 'urgente'
  
  // Contexto
  userId: ObjectId → User,         // Destinatário
  leadId: ObjectId → Lead,
  apoliceId: ObjectId → Apolice,
  
  // Status
  status: Enum,                    // 'ativo' | 'lido' | 'resolvido' | 'ignorado'
  readAt: Date,
  resolvedAt: Date,
  
  // Ação sugerida
  actionUrl: String,
  actionLabel: String,
  
  // Agendamento
  scheduledFor: Date,
  expiresAt: Date,
  
  // Metadata
  metadata: Mixed,
  
  createdBy: ObjectId → User,
  createdAt: Date,
  updatedAt: Date
}
```

**Índices:**
- `userId, status, createdAt` (compound)
- `type, status` (compound)
- `scheduledFor, status` (compound)

**Relacionamentos:**
- **N:1** com `User` (userId, createdBy)
- **N:1** com `Lead` (leadId)
- **N:1** com `Apolice` (apoliceId)

---

### **10. Notifications (Notificações)**
Sistema de notificações em tempo real.

```typescript
{
  _id: ObjectId,
  userId: ObjectId,                // Destinatário
  type: Enum,                      // 'info' | 'success' | 'warning' | 'error'
  title: String,
  message: String,
  read: Boolean,
  link: String,
  metadata: Mixed,
  createdAt: Date,
  updatedAt: Date
}
```

**Índices:**
- `userId, read, createdAt` (compound)

**Relacionamentos:**
- **N:1** com `User` (userId)

---

### **11. Emails (Emails Enviados)**
Registro de emails enviados pelo sistema.

```typescript
{
  _id: ObjectId,
  
  // Destinatários
  to: String,
  toName: String,
  cc: [String],
  bcc: [String],
  
  // Conteúdo
  subject: String,
  body: String,
  htmlBody: String,
  
  // Anexos
  attachments: [{
    filename: String,
    url: String,
    mimeType: String,
    size: Number
  }],
  
  // Tipo e contexto
  type: Enum,                      // 'cotacao' | 'proposta' | 'contrato' | 
                                   // 'boas_vindas' | 'lembrete' | etc.
  leadId: ObjectId → Lead,
  apoliceId: ObjectId → Apolice,
  
  // Status
  status: Enum,                    // 'pendente' | 'enviado' | 'falhou' | 'bounced'
  sentAt: Date,
  errorMessage: String,
  retryCount: Number,
  
  // Rastreamento
  messageId: String,
  opened: Boolean,
  openedAt: Date,
  clicked: Boolean,
  clickedAt: Date,
  
  // Template
  templateId: String,
  templateData: Mixed,
  
  sentBy: ObjectId → User,
  createdAt: Date,
  updatedAt: Date
}
```

**Índices:**
- `leadId, status`
- `to, status`
- `messageId`

**Relacionamentos:**
- **N:1** com `Lead` (leadId)
- **N:1** com `Apolice` (apoliceId)
- **N:1** com `User` (sentBy)

---

### **12. Integrations (Integrações)**
Configurações de integrações externas (Meta Ads, Google Ads, etc).

```typescript
{
  _id: ObjectId,
  
  // Identificação
  name: String,
  type: Enum,                      // 'meta' | 'google_ads' | 'webhook' | etc.
  active: Boolean,
  
  // Configuração
  config: {
    // Para Meta/Facebook
    pageId: String,
    accessToken: String,
    verifyToken: String,
    
    // Para Google Ads
    customerId: String,
    developerToken: String,
    clientId: String,
    clientSecret: String,
    refreshToken: String,
    
    // Para Webhooks
    url: String,
    secret: String,
    events: [String],
    
    // Genérico
    metadata: Mixed
  },
  
  // Mapeamento automático
  autoMapping: {
    enabled: Boolean,
    fieldMappings: Mixed,
    defaultPipelineId: ObjectId → Pipeline,
    defaultStageId: ObjectId → Stage,
    defaultOwnerId: ObjectId → User
  },
  
  // Estatísticas
  stats: {
    totalLeads: Number,
    lastSyncAt: Date,
    lastError: String
  },
  
  createdBy: ObjectId → User,
  createdAt: Date,
  updatedAt: Date
}
```

**Índices:**
- `type, active` (compound)
- `config.pageId`
- `config.verifyToken`

**Relacionamentos:**
- **N:1** com `User` (createdBy, defaultOwnerId)
- **N:1** com `Pipeline` (defaultPipelineId)
- **N:1** com `Stage` (defaultStageId)

---

### **13. Consents (Consentimentos LGPD)**
Registro de consentimentos para tratamento de dados pessoais.

```typescript
{
  _id: ObjectId,
  leadId: ObjectId → Lead,
  consentGiven: Boolean,
  consentDate: Date,
  ip: String,
  userAgent: String,
  createdAt: Date,
  updatedAt: Date
}
```

**Índices:**
- `leadId`

**Relacionamentos:**
- **N:1** com `Lead` (leadId)

---

### **14. Audit (Auditoria)**
Logs de auditoria para compliance e rastreamento.

```typescript
{
  _id: ObjectId,
  action: String,                  // Ação realizada
  userId: ObjectId → User,
  resource: String,                // Tipo de recurso
  resourceId: String,              // ID do recurso
  payload: Mixed,                  // Dados da ação
  createdAt: Date,
  updatedAt: Date
}
```

**Índices:**
- `userId, createdAt` (compound)
- `resource, resourceId` (compound)
- `action, createdAt` (compound)

**Relacionamentos:**
- **N:1** com `User` (userId)

---

### **15. Views (Visualizações Salvas)**
Filtros e visualizações personalizadas salvas pelos usuários.

```typescript
{
  _id: ObjectId,
  name: String,
  owner: ObjectId → User,
  filters: Mixed,                  // Objeto com filtros aplicados
  isShared: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

**Índices:**
- `owner, createdAt` (compound)

**Relacionamentos:**
- **N:1** com `User` (owner)

---

### **16. PasswordResets (Redefinição de Senha)**
Tokens temporários para redefinição de senha.

```typescript
{
  _id: ObjectId,
  userId: ObjectId → User,
  token: String,
  expiresAt: Date,                 // TTL Index
  createdAt: Date
}
```

**Índices:**
- `token` (unique)
- `expiresAt` (TTL index, expireAfterSeconds: 0)

**Relacionamentos:**
- **N:1** com `User` (userId)

---

### **17. PipelineColumns (Colunas de Pipeline - Legado)**
Modelo legado mantido para compatibilidade.

```typescript
{
  _id: ObjectId,
  name: String,
  pipelineId: ObjectId,
  order: Number,
  color: String,
  createdAt: Date,
  updatedAt: Date
}
```

> ⚠️ **Nota:** Esta coleção está sendo descontinuada em favor de `Stages`

---

### **18. Activity (Modelo de Atividades - Legado)**
Modelo legado duplicado, mantido para compatibilidade.

```typescript
{
  _id: ObjectId,
  leadId: ObjectId → Lead,
  type: String,
  description: String,
  userId: ObjectId → User,
  metadata: Mixed,
  createdAt: Date
}
```

> ⚠️ **Nota:** Usar preferentemente a coleção `Activities` no módulo leads

---

## 📈 Diagrama de Relacionamentos Principais

```
┌─────────────┐
│    User     │
└──────┬──────┘
       │
       ├─────────────────────────────┐
       │                             │
       │ owner/owners                │ userId
       ▼                             ▼
┌─────────────┐              ┌──────────────┐
│    Lead     │◄─────────────│  Activities  │
└──────┬──────┘              └──────────────┘
       │
       ├─────► Notes
       ├─────► Attachments
       ├─────► Alerts
       ├─────► Emails
       ├─────► Consents
       │
       │ pipelineId
       ▼
┌─────────────┐
│  Pipeline   │
└──────┬──────┘
       │
       │ stages
       ▼
┌─────────────┐
│   Stage     │
└─────────────┘

┌─────────────┐
│   Lead      │
└──────┬──────┘
       │
       │ apoliceId
       ▼
┌─────────────┐
│  Apolice    │
└──────┬──────┘
       │
       ├─────► Alerts
       └─────► Emails
```

---

## 🔐 Índices e Performance

### Índices Compostos Críticos

1. **Leads - Kanban**: `{pipelineId: 1, stageId: 1, rank: 1}`
2. **Leads - Qualificação**: `{qualificationStatus: 1, createdAt: -1}`
3. **Leads - Distribuição**: `{owners: 1, qualificationStatus: 1}`
4. **Activities**: `{leadId: 1, createdAt: -1}`
5. **Alerts**: `{userId: 1, status: 1, createdAt: -1}`
6. **Apolices**: `{status: 1, dataVencimento: 1}`

### Índices TTL (Time-To-Live)

- **PasswordResets.expiresAt**: Expiração automática de tokens

---

## 🔄 Fluxos de Dados Principais

### 1. Criação de Lead

```
Integration → Lead → Activity (created) → Alert (novo lead)
```

### 2. Movimentação no Kanban

```
Lead.stageId update → 
  Activity (stage_change) → 
  Lead.enteredStageAt update → 
  SLA calculation → 
  Alert (se necessário)
```

### 3. Fechamento de Venda

```
Lead → Apolice creation → 
  Lead.apoliceId update → 
  Lead.status = 'convertido' → 
  Activity (won) → 
  Email (boas vindas)
```

### 4. Sistema SLA

```
Cron Job → Check Lead.dueDate → 
  Update Lead.isOverdue → 
  Calculate overdueHours → 
  Create Alert
```

---

## 💾 Estimativa de Armazenamento

### Por Lead Completo

- Lead: ~2 KB
- Activities (média 20): ~40 KB
- Notes (média 5): ~5 KB
- Attachments (média 3): ~300 bytes (apenas metadados)
- **Total por lead:** ~47 KB

### Projeções

| Leads       | Espaço Estimado |
|-------------|-----------------|
| 1.000       | ~47 MB          |
| 10.000      | ~470 MB         |
| 100.000     | ~4.7 GB         |
| 1.000.000   | ~47 GB          |

---

## 🔧 Considerações Técnicas

### Embedded vs Referenced

**Embedded (Subdocumentos):**
- `Lead.faixasEtarias`
- `Lead.address`
- `Apolice.dependentes`
- `User.preferences`

**Referenced (ObjectId):**
- Todos os relacionamentos entre coleções principais
- Permite queries independentes e melhor normalização

### Soft Delete vs Hard Delete

O sistema utiliza **hard delete** para a maioria das entidades, exceto:
- `User.active = false` (soft delete)
- `Lead.status = 'perdido'` (mantém histórico)
- `Apolice.status = 'cancelada'` (mantém histórico)

### Transações

Operações críticas que utilizam transações MongoDB:
- Movimentação de lead entre stages (update lead + create activity)
- Criação de apólice (create apolice + update lead)
- Distribuição automática de leads

---

## 📝 Observações Importantes

1. **MongoDB vs Relacional**: Apesar de ser NoSQL, o modelo segue princípios relacionais com referências bem definidas
2. **Redundância Controlada**: Alguns dados são desnormalizados propositalmente para performance (ex: `Lead.qualificationScore`)
3. **Histórico**: `Activities` funciona como audit trail completo do lead
4. **LGPD**: `Consents` e `Audit` garantem compliance
5. **Escalabilidade**: Índices otimizados para queries mais frequentes

---

## 🎯 Próximas Evoluções

1. **Sharding**: Considerar quando passar de 1M de leads
2. **Read Replicas**: Para relatórios pesados
3. **Arquivamento**: Mover leads antigos para cold storage após 2 anos
4. **Cache Redis**: Para pipeline stats e dashboard metrics
5. **ElasticSearch**: Para busca full-text avançada

---

**Documento gerado em:** 10/01/2026  
**Versão do sistema:** 1.0  
**Última atualização do modelo:** Janeiro 2026
