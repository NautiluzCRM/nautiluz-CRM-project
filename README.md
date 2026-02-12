# 🚀 Nautiluz CRM

> Sistema Interno de Gestão Comercial e Operacional da Nautiluz.

![Status](https://img.shields.io/badge/STATUS-ENTREGUE-brightgreen?style=for-the-badge)
![Versão](https://img.shields.io/badge/VERSÃO-1.0.0-blue?style=for-the-badge)
[![Frontend](https://img.shields.io/badge/Frontend-React_18-20232A?style=for-the-badge&logo=react)](https://nautiluzcrm.com.br)
[![Backend](https://img.shields.io/badge/Backend-Node.js-339933?style=for-the-badge&logo=nodedotjs)](https://nautiluzcrm.com.br)

## 📋 Sobre o Projeto

Este repositório contém o código-fonte do **CRM Nautiluz**, uma aplicação web desenvolvida sob medida para centralizar e otimizar os processos exclusivos da corretora.

O sistema foi projetado para substituir controles manuais e planilhas, integrando em uma única plataforma a captação de leads, o funil de vendas especializado em saúde (contagem de vidas e faixas etárias) e a gestão em geral.

**Escopo de Uso:** Aplicação de uso restrito e interno para colaboradores da Nautiluz.

🔗 **Ambiente de Produção:** [nautiluzcrm.com.br](https://nautiluzcrm.com.br)

## 🛠️ Arquitetura e Tecnologias

A solução utiliza uma arquitetura moderna baseada em microsserviços lógicos para garantir escalabilidade e performance no processamento de dados da corretora.

### 🎨 Frontend (Interface)
* **Core:** React 18, Vite, TypeScript.
* **UI/UX:** Tailwind CSS + Shadcn/UI (Radix Primitives) para responsividade (Mobile/Desktop).
* **Funcionalidades:**
    * **Kanban Customizado:** Gestão visual de leads com `@dnd-kit`.
    * **Dashboards:** Visualização de métricas de vendas e conversão.
    * **Formulários Dinâmicos:** Validação de regras de negócio (vidas/idades) com `zod`.

### ⚙️ Backend (API e Processamento)
* **Core:** Node.js + Express (TypeScript).
* **Banco de Dados:** MongoDB.
* **Segurança:** Autenticação JWT e controle de acesso (RBAC) granular.
* **Integrações:**
    * **Resend/SMTP:** Disparo de e-mails transacionais.
    * **Cloudinary:** Gestão de arquivos e apólices digitais.
    * **Instagram/Meta:** Captação automática de leads.

## 📂 Estrutura do Repositório

O código segue padrões de *Clean Architecture* para facilitar a manutenção futura pela equipe de TI da Nautiluz.

```bash
.
├── backend
│   ├── scripts/             # Automações (Análise de schema, Restore pipelines)
│   ├── src
│   │   ├── auth/            # Autenticação e JWT
│   │   ├── config/          # Variáveis de ambiente e conexões
│   │   ├── database/        # Configuração MongoDB e Seeds
│   │   ├── jobs/            # Workers BullMQ
│   │   ├── modules/         # Domínios de Negócio (Leads, Kanban)
│   │   ├── rbac/            # Controle de Acesso (Roles & Permissões)
│   │   ├── services/        # Regras de negócio compartilhadas
│   │   └── server.ts        # Entry point da API
│   └── package.json
│
├── frontend
│   ├── src
│   │   ├── components/      # Componentes UI Reutilizáveis (Shadcn)
│   │   ├── contexts/        # Estado Global (Auth, Theme)
│   │   ├── hooks/           # Custom Hooks (useAuth, useToast)
│   │   ├── lib/             # Utilitários e configurações de API
│   │   ├── pages/           # Rotas da Aplicação (Telas)
│   │   └── App.tsx          # Componente Raiz
│   └── package.json
└── documentação/            # Diagramas UML e manuais técnicos
```

## ✨ Funcionalidades Entregues

O sistema atende integralmente aos requisitos de negócio da Nautiluz, cobrindo o ciclo de vendas e a gestão de carteira.

### 🔹 1. Gestão Comercial (Leads & Pipeline)
- [x] **Kanban Especializado:** Painel visual onde cada card exibe, além dos dados básicos, a **Quantidade de Vidas** e **Faixa Etária**, permitindo priorização imediata pelo potencial do contrato.
- [x] **Distribuição Automática:** O sistema aloca automaticamente os novos leads entre a equipe de vendedores, balanceando a carga de trabalho.
- [x] **Funil Customizável:** O administrador possui autonomia total para criar, editar e excluir colunas do pipeline conforme a evolução do processo comercial.
- [x] **Captação Integrada:** Integração para recebimento automático de leads via formulários.

### 🔹 2. Automação Operacional (E-mail & Anexos)
- [x] **Disparo automático:** Funcionalidade crítica que envia e-mails automáticos pré-configurados.
- [x] **Eficiência Operacional:** Reduz o trabalho manual do vendedor ao preencher automaticamente os dados do plano contratado nos templates de e-mail.

### 🔹 3. Gestão de Apólices (Pós-Venda)
- [x] **Controle de Vigência:** Módulo dedicado para cadastro de apólices com detalhamento de operadora, prêmio mensal, titular e dependentes.
- [x] **Alertas de Renovação:** Sistema de notificações automáticas (configurável) para alertar sobre vencimentos e garantir a renovação.
- [x] **Rastreabilidade:** Vínculo direto entre a apólice gerada e o card do lead original, mantendo o histórico da negociação.

### 🔹 4. Segurança e Perfis de Acesso (RBAC)
- [x] **Hierarquia de Permissões:**
  - **Administrador:** Controle total (Gestão de usuários, customização de pipeline e relatórios globais).
  - **Vendedor:** Visão restrita aos leads sob sua responsabilidade e disparo de e-mails de suas vendas.
     

## 🚀 Guia de Instalação (Ambiente de Desenvolvimento)

Instruções para a equipe técnica configurar e rodar o projeto localmente.

### Pré-requisitos
* **Node.js** (v18 ou superior)
* **MongoDB** (Instância local ou conexão com Atlas)
* **Redis** (Obrigatório para o funcionamento das filas de e-mail/BullMQ)

### 1. Configuração do Backend

```bash
# 1. Acesse a pasta do servidor
cd backend

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
# Crie o arquivo .env na raiz do backend baseando-se no exemplo
cp .env.example .env

# 4. Popule o banco de dados
# Este comando cria os usuários iniciais (Admin) e carrega as operadoras
npm run seed

# 5. Inicie o servidor (Modo Watch)
npm run dev
```

### 2. Configuração do Frontend

```bash
# 1. Acesse a pasta da interface
cd frontend

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
cp .env.example .env

# 4. Inicie a aplicação
npm run dev
```

## 🤝 Créditos
Desenvolvido pela ICMC Júnior para a Nautiluz.

© 2026 NAUTILUZ. Uso exclusivo e proprietário.
