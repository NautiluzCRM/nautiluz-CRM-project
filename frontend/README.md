# README i Frontend (Vite + React + shadcn/ui)

## Visão geral

Frontend do CRM Nautiluz, estilo Pipefy (cards + Kanban).
Stack: **Vite** + **React** + **TypeScript** + **shadcn/ui (Radix)** + **TailwindCSS**.

## Requisitos

* Node.js 18+ (recomendado 20+)
* npm 9+ (ou pnpm/yarn)
* Backend rodando (ver README do backend)

## Instalação

```bash
cd frontend
npm install
```

## Executar em desenvolvimento

```bash
npm run dev
```

Por padrão:

* Local: `http://localhost:8080/`
* Host: configurado para aceitar rede local (vide `vite.config.ts`)

## Build de produção

```bash
npm run build
npm run preview
```

## Variáveis de ambiente

Crie um `.env` (ou `.env.local`) na pasta `frontend/`:

```
VITE_API_URL=http://localhost:3000
VITE_SOCKET_URL=http://localhost:3000
```

> `VITE_API_URL` e `VITE_SOCKET_URL` apontam para o backend (HTTP e WebSocket).

## Estrutura de pastas (resumo)

```
src/
├─ assets/                # imagens, ícones
├─ components/            # componentes compartilhados (inclui ui/* do shadcn)
├─ data/                  # mocks ou constantes
├─ hooks/                 # hooks (ex.: use-toast, use-mobile)
├─ lib/                   # utils (ex.: cn, api client)
├─ pages/                 # páginas (Login, Leads/Kanban, etc.)
├─ types/                 # tipos globais (Lead, Stage, User)
├─ App.tsx / main.tsx
└─ index.css / App.css
```

## shadcn/ui & Tailwind

* Tailwind configurado em `tailwind.config.ts`
* Utilitários em `src/lib/utils.ts` (`cn`)
* Toaster e Toast seguem padrão shadcn (com `use-toast` em `src/hooks/`)

## Kanban (drag & drop)

* Colunas (stages) e cards (leads) renderizados a partir do backend.
* DnD aciona **POST `/kanban/move`** no backend com `{ leadId, toStageId, beforeId?, afterId? }`.
* Atualização em tempo real via **Socket.IO**:

  * Evento `kanban:updated` para sincronizar outros clientes.

## Scripts úteis

```bash
npm run dev        # desenvolvimento
npm run build      # build de produção
npm run preview    # serve build estático localmente
npm run lint       # (se configurado) lint do código
```

## Problemas comuns

* **Import '@/hooks/use-toast' não resolve**: verifique alias `@` nos tsconfigs e se o arquivo existe como `src/hooks/use-toast.ts` (sem espaços ocultos no nome).
* **CORS**: ajuste `VITE_API_URL` e a origem permitida no backend.

## Deploy

* Build estático (pasta `dist/`)
* Pode ser servido por Nginx, Vercel, Netlify, etc.
* Configure `VITE_API_URL` para o endpoint público do backend.