# 🎨 Nautiluz CRM - Frontend

Este diretório contém a interface do usuário do CRM Nautiluz, construída como uma Single Page Application (SPA) moderna e responsiva.

## 🛠️ Stack Tecnológica

A interface foi desenvolvida com foco em performance e experiência do usuário (UX), utilizando as seguintes bibliotecas principais:

* **Core:** React 18 + Vite + TypeScript
* **Estilização:** Tailwind CSS
* **Componentes UI:** Shadcn/UI (Baseado em Radix Primitives + Class Variance Authority)
* **Gerenciamento de Estado (Server):** TanStack Query (React Query)
* **Gerenciamento de Estado (Client):** Context API + React Hooks
* **Roteamento:** React Router DOM
* **Formulários:** React Hook Form + Zod (Validação de Schemas)
* **Kanban (Drag & Drop):** `@dnd-kit/core`
* **Gráficos:** Recharts

## 🚀 Configuração do Ambiente

### 1. Variáveis de Ambiente (.env)
Copie o arquivo de exemplo:
```bash
cp .env.example .env
```
Preencha a variável de conexão com a API:
```
Variável: VITE_API_URL
Descrição: Endereço do Backend
Exemplo: http://localhost:3000
```

### 2. Instalação e Execução
```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento (Hot Reload)
npm run dev

# Verificar erros de tipagem e linting
npm run lint
```

## 🏗️ Arquitetura do Projeto

A organização do código reflete a complexidade do sistema, separando componentes de UI, layout estrutural e páginas de negócio.

* **`src/components/`**:
    * **`ui/`**: Componentes base do **Shadcn/UI** (Button, Input, Dialog, Sheet). Mantenha puros.
    * **`kanban/`**: Componentes exclusivos do funil de vendas.
    * **`llinktree/`**: Componentes da página pública do vendedor.
    * **Estrutura & Layout:**
        * `Layout.tsx`: Shell principal da aplicação (Wrapper).
        * `AppSidebar.tsx` & `Header.tsx`: Navegação lateral e superior responsiva.
        * `ProtectedRoute.tsx`: *Higher-Order Component* que bloqueia acesso de usuários não logados.
    * **Modais de Negócio:**
        * `CreateLeadModal.tsx`: Formulário de entrada de novos leads.
        * `EditLeadModal.tsx` & `LeadDetailsModal.tsx`: Edição e visualização detalhada.

* **`src/pages/`**: Mapeamento completo das telas do sistema.
    * **Operacional:**
        * `Index.tsx`: Kanban principal.
        * `Leads.tsx`: Página de Leads
        * `Calendario.tsx`: Agendamento de tarefas.
        * `Linktree.tsx`: Visualização da bio do vendedor.
    * **Gestão & Dashboards:**
        * `Analytics.tsx`: Gráficos de performance.
        * `Relatorios.tsx` & `Exportacoes.tsx`: Extração de dados.
        * `Metas.tsx`: Acompanhamento de objetivos comerciais.
    * **Administrativo:**
        * `GestaoVendedores.tsx`: Controle de equipe.
        * `GerenciarUsuarios.tsx`: CRUD de usuários do sistema.
        * `Configuracoes.tsx` & `Integracoes.tsx`: Ajustes sistêmicos e conexão com Meta.
    * **Autenticação:**
        * `Login.tsx`, `ForgotPassword.tsx`, `ResetPassword.tsx`.

* **`src/hooks/`**: Lógica encapsulada.
    * `use-auth.tsx`: Sessão e permissões (RBAC).
    * `use-mobile.tsx`: Detecção de dispositivo móvel.
    * `use-theme.tsx`: Controle do Dark/Light mode.
    * `use-toast.ts`: Disparo de notificações flutuantes (Sucesso/Erro).

* **`src/lib/`**: Configurações de infraestrutura.
    * `api.ts`
    * `utils.ts`

## 🧩 Funcionalidades Chave & Implementação

### 1. Kanban Drag-and-Drop
O coração do sistema utiliza `@dnd-kit` para permitir a movimentação fluida de cards entre as colunas.
* **Estratégia:** Utilizamos *Optimistic UI* via React Query para atualizar a posição do card instantaneamente na interface, enquanto a requisição é processada em segundo plano.

### 2. Formulários Inteligentes (Saúde)
A entrada de dados utiliza `react-hook-form` integrado com `zod` para validação rigorosa.
* **Regra de Negócio:** O schema valida campos críticos como "Quantidade de Vidas" e "Faixas Etárias", garantindo que o lead só entre no funil com dados consistentes.

### 3. Controle de Acesso (RBAC)
O hook `useAuth()` consome o contexto de autenticação para expor o perfil do usuário logado.
* **Implementação:** O front esconde automaticamente rotas e botões sensíveis (como "Configurações" ou "Exportar Relatório") caso o usuário seja do perfil **Vendedor**, mantendo a segurança da interface.

## 🎨 Estilização e Tema

O projeto utiliza **Tailwind CSS** como motor de estilização, garantindo a responsividade exigida.

* **Design System:** As cores, fontes e espaçamentos seguem o padrão definido em `tailwind.config.ts` e `index.css`.
* **Dark Mode:** A interface suporta nativamente o modo escuro, ativado via classes `dark:` do Tailwind.
* **Responsividade:** Utiliza os breakpoints padrão (`md:`, `lg:`) para adaptar o layout do Kanban e das tabelas para dispositivos móveis e tablets.

## 📦 Scripts de Build

Comandos disponíveis no `package.json` para o ciclo de vida da aplicação:

* **`npm run dev`**: Inicia o servidor de desenvolvimento local (Vite) com Hot Module Replacement (HMR).
* **`npm run build`**: Compila o TypeScript e gera os arquivos otimizados para produção na pasta `dist/`.
* **`npm run preview`**: Permite visualizar localmente a versão de produção gerada pelo build.
* **`npm run lint`**: Executa a verificação estática de código (ESLint) para garantir padronização e evitar erros de sintaxe.
