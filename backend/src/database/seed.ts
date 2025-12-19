// backend/src/database/seed.ts

import '../config/env.js';
import { connectMongo, disconnectMongo } from './mongoose.js';
import { UserModel } from '../modules/users/user.model.js';
import { PipelineModel } from '../modules/pipelines/pipeline.model.js';
import { StageModel } from '../modules/pipelines/stage.model.js';
import { LeadModel } from '../modules/leads/lead.model.js';
import { hashPassword } from '../auth/password.js';

async function seed() {
  console.log('🌱 Iniciando Seed...');
  await connectMongo();

  // 1. LIMPEZA (RESET)
  // Removemos tudo de Leads e Pipeline para garantir um estado limpo e consistente
  console.log('🧹 Limpando coleções antigas...');
  await LeadModel.deleteMany({});
  await StageModel.deleteMany({});
  await PipelineModel.deleteMany({});
  // Nota: Não damos deleteMany em Users para manter sessões ativas se houver, usamos upsert abaixo.

  // 2. SEED DE USUÁRIOS
  console.log('👤 Verificando/Criando usuários...');
  const demoPassword = 'demo123';
  const demoUsers = [
    { name: 'Administrador', email: 'admin@nautiluz.com', role: 'admin' },
    { name: 'Ana Vendas', email: 'vendas@nautiluz.com', role: 'vendedor' },
    { name: 'Carlos Financeiro', email: 'financeiro@nautiluz.com', role: 'financeiro' }
  ];

  for (const user of demoUsers) {
    const passwordHash = await hashPassword(demoPassword);
    await UserModel.updateOne(
      { email: user.email },
      {
        $set: {
          name: user.name,
          email: user.email,
          passwordHash,
          role: user.role,
          active: true
        }
      },
      { upsert: true }
    );
  }
  
  // Pegamos o Admin para ser dono dos leads
  const adminUser = await UserModel.findOne({ email: 'admin@nautiluz.com' });
  if (!adminUser) throw new Error("Falha ao criar usuário admin");

  // 3. SEED DE PIPELINE E STAGES (Com Cores e SLA!)
  console.log('🏗️ Criando Pipeline e Etapas...');
  
  const pipeline = await PipelineModel.create({ name: 'Pipeline de Vendas', key: 'default' });

  const stagesData = [
    { name: 'Novo', order: 1, key: 'novo', color: '#3B82F6', sla: 24 },          // Azul
    { name: 'Qualificação', order: 2, key: 'qualificacao', color: '#8B5CF6', sla: 48 }, // Roxo
    { name: 'Cotação', order: 3, key: 'cotacao', color: '#F59E0B', sla: 72 },       // Amarelo/Laranja
    { name: 'Proposta', order: 4, key: 'proposta', color: '#EF4444', sla: 96 },      // Vermelho
    { name: 'Negociação', order: 5, key: 'negociacao', color: '#F97316', sla: 120 },    // Laranja Escuro
    { name: 'Fechamento', order: 6, key: 'fechamento', color: '#10B981', sla: 0 }      // Verde
  ];

  // Dicionário para mapear key -> ID (para usarmos nos leads)
  const stageIds: Record<string, any> = {};

  for (const s of stagesData) {
    const stage = await StageModel.create({ ...s, pipelineId: pipeline._id });
    stageIds[s.key] = stage._id;
  }

  // 4. SEED DE LEADS
  console.log('👥 Criando Leads de teste...');

  const demoLeads = [
    {
      name: 'Empresa Alpha Ltda',
      company: 'Alpha Industries',
      email: 'contato@alpha.com.br',
      phone: '(11) 99999-1111',
      origin: 'Google Ads',
      livesCount: 15,
      stageId: stageIds['novo'],
      value: 1500
    },
    {
      name: 'Roberto Consultoria',
      company: 'Roberto ME',
      email: 'roberto@email.com',
      phone: '(21) 98888-2222',
      origin: 'Indicação',
      livesCount: 2,
      stageId: stageIds['qualificacao'],
      value: 300
    },
    {
      name: 'Tech Solutions S.A.',
      company: 'Tech Solutions',
      email: 'compras@techsol.com',
      phone: '(31) 3333-4444',
      origin: 'LinkedIn',
      livesCount: 150,
      stageId: stageIds['cotacao'],
      value: 25000
    },
    {
      name: 'Padaria do João',
      company: 'Padaria Pão Quente',
      email: 'joao@padaria.com',
      phone: '(11) 2222-3333',
      origin: 'Facebook',
      livesCount: 5,
      stageId: stageIds['negociacao'],
      value: 800
    },
    {
      name: 'Clínica Bem Estar',
      company: 'Bem Estar Ltda',
      email: 'adm@bemestar.com',
      phone: '(41) 97777-6666',
      origin: 'Site',
      livesCount: 20,
      stageId: stageIds['fechamento'],
      value: 4500
    },
    {
      name: 'Startup Inovadora',
      company: 'Inova Tech',
      email: 'hello@inova.com',
      phone: '(48) 99999-8888',
      origin: 'Instagram',
      livesCount: 10,
      stageId: stageIds['novo'], // Mais um no topo do funil
      value: 1200
    }
  ];

  // Como limpamos a tabela, podemos usar create direto (mais rápido e limpo)
  const leadsToCreate = demoLeads.map(lead => ({
    name: lead.name,
    email: lead.email,
    phone: lead.phone,
    company: lead.company,
    origin: lead.origin,
    livesCount: lead.livesCount,
    avgPrice: lead.value,
    
    pipelineId: pipeline._id,
    stageId: lead.stageId,
    owner: adminUser._id,
    owners: [adminUser._id],
    
    rank: '0|h00000:', 
    hasCnpj: true,
    city: 'São Paulo',
    state: 'SP',
    createdAt: new Date(),
    lastActivityAt: new Date()
  }));

  await LeadModel.insertMany(leadsToCreate);
  
  console.log('✅ Seed concluído com sucesso!');
  await disconnectMongo();
}

seed().catch((err) => {
  console.error('❌ Erro no seed:', err);
  process.exit(1);
});