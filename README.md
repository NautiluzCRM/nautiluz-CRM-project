# Nautiluz CRM

CRM focado em **captação e gestão de leads de saúde**, com **pipeline Kanban (drag & drop)**, cards ricos, filtros, relatórios e exportação `.xlsx`.
Stack principal: **Frontend** (Vite + React + TypeScript + shadcn/ui) e **Backend** (Node.js + TypeScript + Express + MongoDB Atlas + Mongoose). Tempo real via **Socket.IO**.

## Estrutura do repositório

```
/frontend   # SPA em React (Vite, shadcn/ui, Tailwind)
/backend    # API REST + WebSocket (Express, Mongoose, LexoRank p/ Kanban)
```

## Padrão de desenvolvimento

### Branches

* **main**: estável / produção
* **develop**: integração contínua (pré-release)
* **feature/***: novas funcionalidades
  Ex.: `feature/kanban-dnd`, `feature/export-xlsx`
* **fix/***: correções
  Ex.: `fix/login-redirect`
* **hotfix/***: correções críticas diretamente a `main`
* **release/***: preparação de versão
  Ex.: `release/1.3.0`

### Commits (Conventional Commits)

Formato: `tipo(escopo): resumo`

* **feat**: nova feature (`feat(kanban): mover card entre colunas`)
* **fix**: correção (`fix(auth): refresh token inválido`)
* **chore**: tarefas diversas (configs, deps)
* **docs**: documentação / README
* **refactor**: refatoração sem mudança de comportamento
* **test**: testes
* **perf**: performance
* **build/ci**: build/CI

Exemplos:

```bash
git commit -m "feat(leads): filtros por origem e período"
git commit -m "fix(api): validação de payload no /kanban/move"
```

### Pull Requests (PRs)

* Abra PR de `feature/*` → `develop` (ou `hotfix/*` → `main`).
* **Checklist**:

  * Descrição clara do problema/solução
  * Screenshots/GIFs quando for UI
  * Testes relevantes (quando aplicável)
  * Sem *console.log* e sem código comentado
  * Passou **lint** e **build**
* **Review** de pelo menos 1 pessoa antes de merge.
* **Merge** preferencialmente via **Squash & Merge** (histórico limpo).

### Code Style

* **TypeScript** em frontend e backend
* **ESLint + Prettier** (padrão recomendado)
* Nomes claros, funções curtas, early-returns
* Camadas bem separadas (controller -> service -> model)

## Deploy (resumo)

* **Frontend**: `npm run build` → servir `frontend/dist` (Nginx, Vercel, Netlify…)
* **Backend**: `npm run build` + PM2/Docker
* **MongoDB**: Atlas (IPs permitidos e usuário por ambiente)
* Configure `VITE_API_URL`/`VITE_SOCKET_URL` no frontend para o domínio do backend

## Contas/Seeds (dev)

* Admin padrão após `npm run seed`

  * **email**: `admin@nautiluz.com`
  * **senha**: `admin123` (alterar no primeiro login)

## Suporte rápido

* **CORS?** Ajuste `CORS_ORIGIN` no backend.
* **Mongo (Atlas)?** Confira `MONGO_URI`, `MONGO_DB_NAME` e IP liberado.
* **SocketIO?** Veja `VITE_SOCKET_URL` e porta do backend.