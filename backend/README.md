
# README - Backend (Node.js + MongoDB)

## Visão geral

Backend do CRM Nautiluz.
Stack: **Node.js** + **Express** + **TypeScript** + **Mongoose (MongoDB)** + **JWT** + **Zod** + **Socket.IO** + **BullMQ (Redis)** para jobs (SLA/export) + **xlsx** (exportações).

Foco: **Kanban drag & drop** com ordenação estável (**LexoRank**), RBAC, auditoria, exportação .xlsx e webhook do Instagram (fase 2).

## Requisitos

* Node.js 18+ (recomendado 20+)
* MongoDB 6+ (local ou Atlas)
* Redis 6+ (se usar filas/SLAs/export assíncronos)
* npm 9+

> Para ambiente local, você pode subir Mongo e Redis via Docker (ver “Docker Compose” mais abaixo).

## Instalação

```bash
cd backend
npm install
```

## Variáveis de ambiente

Crie um `.env` na raiz `backend/` (exemplo):

```
# App
NODE_ENV=development
PORT=3000
CORS_ORIGIN=http://localhost:8080

# JWT
JWT_SECRET=uma_chave_bem_secreta
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=outra_chave_secreta
JWT_REFRESH_EXPIRES_IN=7d

# Mongo
MONGO_URI=mongodb://localhost:27017/nautiluz_crm

# Redis (para BullMQ)
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# Storage (opcional; usar local em dev)
STORAGE_PROVIDER=local
UPLOAD_DIR=./uploads

# Export
EXPORT_SIGNED_URL_TTL_SECONDS=3600
```

## Scripts

```bash
npm run dev        # ts-node-dev / nodemon com tsconfig
npm run build      # compila TS -> dist
npm run start      # roda a partir de dist
npm run seed       # popula admin e pipeline padrão
npm run lint       # opcional
```

## Estrutura de pastas

```
src/
├─ app.ts                    # Express + middlewares + rotas + Socket.IO attach
├─ server.ts                 # inicialização HTTP, DB, workers
├─ routes.ts                 # agrega rotas de módulos
├─ config/
│  ├─ env.ts                 # carrega e valida .env (zod)
│  ├─ logger.ts              # pino
│  ├─ cors.ts                # CORS
│  └─ rate-limit.ts          # rate limit
├─ database/
│  ├─ mongoose.ts            # conexão e plugins
│  └─ seed.ts                # cria Admin e pipeline/estágios base
├─ auth/
│  ├─ auth.routes.ts
│  ├─ auth.controller.ts
│  ├─ auth.service.ts
│  ├─ jwt.ts                 # sign/verify tokens
│  └─ password.ts            # hash/verify (argon2)
├─ rbac/
│  ├─ rbac.middleware.ts     # extrai user do JWT
│  ├─ rbac.guard.ts          # checa permissões
│  └─ rbac.policies.ts       # matriz Admin/Financeiro/Vendedor
├─ modules/
│  ├─ users/
│  │  ├─ user.model.ts
│  │  ├─ user.routes.ts
│  │  ├─ user.controller.ts
│  │  └─ user.service.ts
│  ├─ pipelines/
│  │  ├─ pipeline.model.ts
│  │  ├─ stage.model.ts
│  │  ├─ pipelines.routes.ts
│  │  ├─ pipelines.controller.ts
│  │  ├─ pipelines.service.ts
│  │  └─ transitions.policy.ts  # regras de transição por coluna/role/campos
│  ├─ leads/
│  │  ├─ lead.model.ts
│  │  ├─ activity.model.ts
│  │  ├─ attachments.model.ts
│  │  ├─ leads.routes.ts
│  │  ├─ leads.controller.ts
│  │  ├─ leads.service.ts
│  │  ├─ activities.service.ts
│  │  └─ leads.validators.ts
│  ├─ kanban/
│  │  ├─ kanban.routes.ts
│  │  ├─ kanban.controller.ts
│  │  └─ kanban.service.ts      # LexoRank + WIP/SLA checks + auditoria de move
│  ├─ filters/
│  │  ├─ view.model.ts
│  │  ├─ filters.routes.ts
│  │  ├─ filters.controller.ts
│  │  └─ filters.service.ts
│  ├─ reports/
│  │  ├─ export.routes.ts
│  │  ├─ export.controller.ts
│  │  └─ export.service.ts      # geração .xlsx (filtrada)
│  ├─ integrations/
│  │  ├─ meta-leads.routes.ts   # webhook Instagram Lead Ads
│  │  ├─ meta-leads.controller.ts
│  │  ├─ meta-leads.service.ts
│  │  └─ meta.validation.ts
│  ├─ audit/
│  │  ├─ audit.model.ts
│  │  └─ audit.service.ts
│  └─ lgpd/
│     ├─ consent.model.ts
│     ├─ privacy.service.ts
│     └─ retention.policy.ts
├─ common/
│  ├─ http.ts                  # AppError, handlers
│  ├─ zod.ts                   # validação padronizada
│  ├─ pagination.ts
│  ├─ upload.ts                # multer/S3/local
│  └─ realtime.ts              # namespaces/emit helpers (Socket.IO)
├─ jobs/
│  ├─ queues.ts
│  ├─ sla.processor.ts
│  ├─ export.processor.ts
│  └─ dedupe.processor.ts
├─ middlewares/
│  ├─ error.ts
│  ├─ validate.ts
│  └─ request-context.ts
└─ typings/express.d.ts
```

## Modelos (resumo)

### Lead (card)

* Campos principais:
  `name`, `company?`, `phone`, `email`, `hasCnpj`, `cnpjType?`, `livesCount`, `ages[]` **ou** `ageBuckets`, `hasCurrentPlan`, `currentPlan?`, `avgPrice?`, `preferredHospitals[]`, `state?`, `city?`, `origin`, `owner`,
  `pipelineId`, `stageId`, `rank` (LexoRank),
  `qualificationStatus`, `lostReason?`, `notes?`,
  `createdBy`, `updatedBy`, `lastActivityAt`, `wonAt?`, `lostAt?`.
* Índices: `{ pipelineId, stageId, rank }`, `{ owner }`, `{ email }`, `{ phone }`.

### Stage

* `pipelineId`, `name`, `order`, `key`, `wipLimit?`, `requiredFieldsOnEnter?`, `requiredFieldsOnExit?`, `allowedRolesToEnter?`, `allowedRolesToExit?`.

### Activity

* `leadId`, `type`, `payload`, `userId`, `ip`, `createdAt`.

### User

* `name`, `email` (unique), `passwordHash`, `role` (`admin|financeiro|vendedor`), `teamId?`, `photoUrl?`, `active`.

## Endpoints (principais)

**Auth**

```
POST   /auth/login
POST   /auth/refresh
POST   /auth/logout
```

**Users (Admin)**

```
GET    /users
POST   /users
GET    /users/:id
PATCH  /users/:id
DELETE /users/:id   # inativar
```

**Pipelines & Stages (Admin)**

```
GET    /pipelines
POST   /pipelines
PATCH  /pipelines/:id
DELETE /pipelines/:id
GET    /pipelines/:id/stages
POST   /pipelines/:id/stages
PATCH  /stages/:id
DELETE /stages/:id
```

**Leads (cards)**

```
GET    /leads        # filtros: owner, stage, período, origem, vidas, UF, etc.
POST   /leads
GET    /leads/:id
PATCH  /leads/:id
DELETE /leads/:id
POST   /leads/:id/assign/:userId
POST   /leads/:id/activities
```

**Kanban (drag & drop)**

```
POST   /kanban/move  # body: { leadId, toStageId, beforeId?, afterId? }
```

**Views/Filters**

```
GET    /views
POST   /views
PATCH  /views/:id
DELETE /views/:id
```

**Exportações**

```
POST   /exports/xlsx # dispara job; retorna link/URL quando pronto
```

**Integrações (Instagram Lead Ads)**

```
POST   /integrations/meta/webhook
```

## WebSocket (Socket.IO)

Namespace padrão `"/"`:

* `kanban:join` `{ pipelineId }` -> entra na sala do pipeline
* **Emitido pelo servidor**:

  * `kanban:updated` `{ leadId, stageId, rank, by }`
  * `lead:updated` `{ leadId, diff, by }`
  * `sla:alert` `{ leadId, stageId, level }`

> O frontend escuta `kanban:updated` para atualizar a UI imediatamente após um `move`.

## Kanban — Ordenação com LexoRank

* Cada card tem string `rank`.
* **Mover dentro da mesma coluna**: `rank = between(before.rank, after.rank)`.
* **Mover para outra coluna**: `stageId = toStageId` e `rank` novo (entre vizinhos ou ao meio).

aqui vai a seção **corrigida** para rodar localmente usando **MongoDB Atlas** (e Redis opcional). substitui a que você colou:

---

## Rodando localmente (com MongoDB Atlas)

### 0) Pré-requisitos no Atlas

1. Crie um **Database User** no Atlas (User/Password).
2. Em **Network Access**, libere seu IP (ou `0.0.0.0/0` só para DEV).
3. Copie a **connection string** (Drivers -> Node.js).

No arquivo `backend/.env`:

```env
NODE_ENV=development
PORT=3000
CORS_ORIGIN=http://localhost:8080

JWT_SECRET=uma_chave_bem_secreta
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=outra_chave_secreta
JWT_REFRESH_EXPIRES_IN=7d

# Mongo Atlas
MONGO_URI="mongodb+srv://<USUARIO>:<SENHA>@<CLUSTER>.mongodb.net/nautiluz?retryWrites=true&w=majority&appName=NautiluzCRM"
MONGO_DB_NAME=nautiluz

# (opcional) Redis para filas de SLA/export
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

STORAGE_PROVIDER=local
UPLOAD_DIR=./uploads
```

### 1) (Opcional) Redis com Docker

Se você quiser usar filas (SLA/export), suba um Redis local:

Crie `docker-compose.yml`:

```yaml
version: "3.8"
services:
  redis:
    image: redis:7
    ports: ["6379:6379"]
```

Suba:

```bash
docker compose up -d
```

> Se **não** for usar filas por enquanto, pode pular este passo e deixar o backend sem Redis (ou desabilitar as filas no código de dev).

### 2) Backend

Desenvolvimento (hot reload):

```bash
npm run dev
```

Produção (build + start):

```bash
npm run build && npm run start
```

O backend sobe em `http://localhost:${PORT}` (padrão `3000`).

### 3) Seed (admin + pipeline padrão)

```bash
npm run seed
```

Admin padrão:

* **email**: `admin@nautiluz.com`
* **senha**: `admin123` *(altere após o primeiro login)*

---

## Segurança & LGPD (resumo)

* Hash de senhas (argon2).
* RBAC (Admin/Financeiro/Vendedor).
* Auditoria de eventos sensíveis (criação, edição, movimentação, export).
* Consentimento & retenção (módulo `lgpd/`).
* Exportações geram planilha somente com permissão adequada e log de auditoria.
* CORS restrito por `CORS_ORIGIN`.

## Testes

* Sugestão: **Vitest** ou **Jest**.
* Unitários para services/policies e integração para rotas críticas (auth, kanban move).

## Troubleshooting

* **CORS**: ajuste `CORS_ORIGIN` no `.env`.
* **Conexão Mongo (Atlas)**: confira `MONGO_URI`, `MONGO_DB_NAME`, usuário/senha e **IP liberado** no Atlas.
* **Sem Redis**: desabilite filas ou use *fallback* síncrono em dev.
* **Socket não conecta**: confira `VITE_SOCKET_URL` no frontend e a porta do backend.
