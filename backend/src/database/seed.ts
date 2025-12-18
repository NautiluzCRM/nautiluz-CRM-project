
import '../config/env.js';
import { connectMongo, disconnectMongo } from './mongoose.js';
import { UserModel } from '../modules/users/user.model.js';
import { PipelineModel } from '../modules/pipelines/pipeline.model.js';
import { StageModel } from '../modules/pipelines/stage.model.js';
import { LeadModel } from '../modules/leads/lead.model.js';
import { hashPassword } from '../auth/password.js';

async function seed() {
  await connectMongo();

  // SEED DE USUÁRIOS
  const demoPassword = 'demo123';
  const demoUsers = [
    { name: 'Administrador', email: 'admin@nautiluz.com', role: 'admin' },
    { name: 'Ana Vendas', email: 'vendas@nautiluz.com', role: 'vendedor' },
    { name: 'Carlos Financeiro', email: 'financeiro@nautiluz.com', role: 'financeiro' }
  ];

  for (const user of demoUsers) {
    const passwordHash = await hashPassword(demoPassword);
    const result = await UserModel.updateOne(
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

    if (result.upsertedCount && result.upsertedId) {
      console.log('User created:', user.email);
    } else {
      console.log('User updated:', user.email);
    }
  }

  // SEED DE PIPELINE E STAGES
  const pipelineExists = await PipelineModel.findOne({ key: 'default' });
  if (!pipelineExists) {
    const pipeline = await PipelineModel.create({ name: 'Pipeline Padrão', key: 'default' });
    const stages = [
      { name: 'Novo', order: 1, key: 'novo' },
      { name: 'Qualificação', order: 2, key: 'qualificacao' },
      { name: 'Cotação', order: 3, key: 'cotacao' },
      { name: 'Proposta', order: 4, key: 'proposta' },
      { name: 'Negociação', order: 5, key: 'negociacao' },
      { name: 'Fechamento', order: 6, key: 'fechamento' }
    ];
    for (const s of stages) {
      await StageModel.create({ ...s, pipelineId: pipeline._id });
    }
    console.log('Pipeline padrão criado com estágios.');
  }

  // SEED DE LEADS
  
  const adminUser = await UserModel.findOne({ email: 'admin@nautiluz.com' });
  const defaultPipeline = await PipelineModel.findOne({ key: 'default' });
  const allStages = await StageModel.find({ pipelineId: defaultPipeline?._id });

  const getStageId = (key: string) => allStages.find(s => s.key === key)?._id;

  if (adminUser && defaultPipeline && allStages.length > 0) {
    const demoLeads = [
      {
        name: 'Empresa Alpha Ltda',
        company: 'Alpha Industries',
        email: 'contato@alpha.com.br',
        phone: '(11) 99999-1111',
        origin: 'Google Ads',
        livesCount: 15,
        stageKey: 'novo',
        value: 1500
      },
      {
        name: 'Roberto Consultoria',
        company: 'Roberto ME',
        email: 'roberto@email.com',
        phone: '(21) 98888-2222',
        origin: 'Indicação',
        livesCount: 2,
        stageKey: 'qualificacao',
        value: 300
      },
      {
        name: 'Tech Solutions S.A.',
        company: 'Tech Solutions',
        email: 'compras@techsol.com',
        phone: '(31) 3333-4444',
        origin: 'LinkedIn',
        livesCount: 150,
        stageKey: 'cotacao',
        value: 25000
      },
      {
        name: 'Padaria do João',
        company: 'Padaria Pão Quente',
        email: 'joao@padaria.com',
        phone: '(11) 2222-3333',
        origin: 'Facebook',
        livesCount: 5,
        stageKey: 'negociacao',
        value: 800
      },
      {
        name: 'Clínica Bem Estar',
        company: 'Bem Estar Ltda',
        email: 'adm@bemestar.com',
        phone: '(41) 97777-6666',
        origin: 'Site',
        livesCount: 20,
        stageKey: 'fechamento',
        value: 4500
      }
    ];

    for (const lead of demoLeads) {
        const stageId = getStageId(lead.stageKey);
        
        if (stageId) {
            await LeadModel.updateOne(
                { email: lead.email },
                {
                    $set: {
                        name: lead.name,
                        email: lead.email,
                        phone: lead.phone,
                        company: lead.company,
                        origin: lead.origin,
                        livesCount: lead.livesCount,
                        avgPrice: lead.value,
                        
                        pipelineId: defaultPipeline._id,
                        stageId: stageId,
                        owner: adminUser._id,
                        owners: [adminUser._id],
                        
                        rank: '0|h00000:', 
                        hasCnpj: true,
                        city: 'São Paulo',
                        state: 'SP'
                    }
                },
                { upsert: true }
            );
        }
    }
    console.log('Leads de teste verificados/criados.');
  } else {
    console.error('Erro ao criar leads: Usuário Admin, Pipeline ou Estágios não encontrados.');
  }

  await disconnectMongo();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});