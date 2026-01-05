// backend/src/database/seed.ts
/**
 * Script de Seed - Popula o banco de dados com dados de demonstração
 * 
 * Usuários:
 * - admin@nautiluz.com / demo123 (Administrador)
 * - vendas@nautiluz.com / demo123 (Vendedor)
 * - vendas2@nautiluz.com / demo123 (Vendedor 2)
 * - financeiro@nautiluz.com / demo123 (Financeiro)
 */

import '../config/env.js';
import { connectMongo, disconnectMongo } from './mongoose.js';
import { UserModel } from '../modules/users/user.model.js';
import { PipelineModel } from '../modules/pipelines/pipeline.model.js';
import { StageModel } from '../modules/pipelines/stage.model.js';
import { LeadModel } from '../modules/leads/lead.model.js';
import { ApoliceModel } from '../modules/apolices/apolice.model.js';
import { AlertModel } from '../modules/alerts/alert.model.js';
import { hashPassword } from '../auth/password.js';

async function seed() {
  console.log('🌱 Iniciando Seed do CRM Nautiluz...');
  await connectMongo();

  // ==========================================
  // 1. LIMPEZA (RESET)
  // ==========================================
  console.log('🧹 Limpando coleções antigas...');
  await LeadModel.deleteMany({});
  await StageModel.deleteMany({});
  await PipelineModel.deleteMany({});
  await ApoliceModel.deleteMany({});
  await AlertModel.deleteMany({});

  // ==========================================
  // 2. SEED DE USUÁRIOS
  // ==========================================
  console.log('👤 Criando usuários...');
  const demoPassword = 'demo123';
  
  const demoUsers = [
    { 
      name: 'Administrador Master', 
      email: 'admin@nautiluz.com', 
      role: 'admin',
      phone: '(11) 99999-0001',
      jobTitle: 'Administrador do Sistema'
    },
    { 
      name: 'Ana Paula Vendas', 
      email: 'vendas@nautiluz.com', 
      role: 'vendedor',
      phone: '(11) 99999-0002',
      jobTitle: 'Consultora Comercial Sênior'
    },
    { 
      name: 'Ricardo Oliveira', 
      email: 'vendas2@nautiluz.com', 
      role: 'vendedor',
      phone: '(11) 99999-0003',
      jobTitle: 'Consultor Comercial'
    },
    { 
      name: 'Carlos Eduardo Financeiro', 
      email: 'financeiro@nautiluz.com', 
      role: 'financeiro',
      phone: '(11) 99999-0004',
      jobTitle: 'Analista Financeiro'
    }
  ];

  const userMap: Record<string, any> = {};

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
          phone: user.phone,
          jobTitle: user.jobTitle,
          active: true
        }
      },
      { upsert: true }
    );
    const savedUser = await UserModel.findOne({ email: user.email });
    userMap[user.role] = savedUser;
    if (user.email === 'vendas@nautiluz.com') userMap['vendedor1'] = savedUser;
    if (user.email === 'vendas2@nautiluz.com') userMap['vendedor2'] = savedUser;
  }

  const adminUser = userMap.admin;
  const vendedor1 = userMap.vendedor1;
  const vendedor2 = userMap.vendedor2;

  // ==========================================
  // 3. SEED DE PIPELINE E STAGES
  // ==========================================
  console.log('🏗️ Criando Pipeline e Etapas...');
  
  const pipeline = await PipelineModel.create({ 
    name: 'Pipeline de Vendas', 
    key: 'default',
    description: 'Pipeline principal para gestão de vendas de planos de saúde'
  });

  const stagesData = [
    { name: 'Novo Lead', order: 1, key: 'novo', color: '#3B82F6', sla: 24 },
    { name: 'Qualificação', order: 2, key: 'qualificacao', color: '#8B5CF6', sla: 48 },
    { name: 'Cotação', order: 3, key: 'cotacao', color: '#F59E0B', sla: 72 },
    { name: 'Proposta Enviada', order: 4, key: 'proposta', color: '#EF4444', sla: 96 },
    { name: 'Negociação', order: 5, key: 'negociacao', color: '#F97316', sla: 120 },
    { name: 'Fechado Ganho', order: 6, key: 'fechado_ganho', color: '#10B981', sla: 0 },
    { name: 'Fechado Perdido', order: 7, key: 'fechado_perdido', color: '#6B7280', sla: 0 }
  ];

  const stageIds: Record<string, any> = {};

  for (const s of stagesData) {
    const stage = await StageModel.create({ ...s, pipelineId: pipeline._id });
    stageIds[s.key] = stage._id;
  }

  // ==========================================
  // 4. SEED DE LEADS
  // ==========================================
  console.log('👥 Criando Leads de demonstração...');

  const demoLeads = [
    {
      name: 'Marcos Silva',
      company: 'Alpha Tecnologia Ltda',
      email: 'marcos.silva@alphatech.com.br',
      phone: '(11) 99999-1111',
      whatsapp: '(11) 99999-1111',
      hasCnpj: true,
      cnpj: '12.345.678/0001-90',
      cnpjType: 'ME',
      razaoSocial: 'Alpha Tecnologia Ltda ME',
      nomeFantasia: 'Alpha Tech',
      origin: 'Meta Ads',
      utmSource: 'facebook',
      utmMedium: 'cpc',
      utmCampaign: 'planos_empresariais',
      livesCount: 15,
      faixasEtarias: { ate18: 0, de19a23: 2, de24a28: 4, de29a33: 3, de34a38: 3, de39a43: 2, de44a48: 1, de49a53: 0, de54a58: 0, acima59: 0 },
      hasCurrentPlan: true,
      currentOperadora: 'Unimed',
      avgPrice: 450,
      state: 'SP',
      city: 'São Paulo',
      stageId: stageIds['novo'],
      qualificationStatus: 'novo',
      priority: 'alta',
      score: 75,
      owners: [vendedor1?._id],
      notes: 'Cliente interessado em migrar da Unimed para plano com melhor custo-benefício.'
    },
    {
      name: 'Fernanda Costa',
      company: 'Roberto Consultoria ME',
      email: 'fernanda@robertoconsultoria.com',
      phone: '(21) 98888-2222',
      whatsapp: '(21) 98888-2222',
      hasCnpj: true,
      cnpj: '23.456.789/0001-01',
      cnpjType: 'MEI',
      origin: 'Indicação',
      livesCount: 3,
      faixasEtarias: { ate18: 1, de19a23: 0, de24a28: 0, de29a33: 1, de34a38: 1, de39a43: 0, de44a48: 0, de49a53: 0, de54a58: 0, acima59: 0 },
      hasCurrentPlan: false,
      avgPrice: 280,
      state: 'RJ',
      city: 'Rio de Janeiro',
      stageId: stageIds['qualificacao'],
      qualificationStatus: 'em_contato',
      priority: 'media',
      score: 60,
      owners: [vendedor1?._id],
      notes: 'Primeira vez contratando plano empresarial.'
    },
    {
      name: 'Paulo Mendes',
      company: 'Tech Solutions S.A.',
      email: 'compras@techsolutions.com.br',
      phone: '(31) 3333-4444',
      whatsapp: '(31) 99999-4444',
      hasCnpj: true,
      cnpj: '34.567.890/0001-12',
      cnpjType: 'Grande',
      razaoSocial: 'Tech Solutions S.A.',
      origin: 'LinkedIn',
      livesCount: 180,
      faixasEtarias: { ate18: 0, de19a23: 20, de24a28: 40, de29a33: 45, de34a38: 35, de39a43: 20, de44a48: 10, de49a53: 5, de54a58: 3, acima59: 2 },
      hasCurrentPlan: true,
      currentOperadora: 'Bradesco Saúde',
      currentPlan: 'Empresarial Nacional Plus',
      avgPrice: 520,
      valorProposta: 89000,
      state: 'MG',
      city: 'Belo Horizonte',
      stageId: stageIds['cotacao'],
      qualificationStatus: 'qualificado',
      priority: 'urgente',
      score: 90,
      owners: [adminUser?._id, vendedor1?._id],
      notes: 'Grande conta. Contrato atual vence em 60 dias. Prioritário!'
    },
    {
      name: 'Maria Aparecida',
      company: 'Padaria Pão Quente',
      email: 'maria@paoquente.com.br',
      phone: '(11) 2222-3333',
      hasCnpj: true,
      cnpj: '45.678.901/0001-23',
      cnpjType: 'EPP',
      origin: 'Google Ads',
      utmSource: 'google',
      utmMedium: 'cpc',
      livesCount: 8,
      faixasEtarias: { ate18: 0, de19a23: 1, de24a28: 2, de29a33: 2, de34a38: 1, de39a43: 1, de44a48: 0, de49a53: 1, de54a58: 0, acima59: 0 },
      hasCurrentPlan: false,
      avgPrice: 380,
      valorProposta: 3040,
      state: 'SP',
      city: 'Campinas',
      stageId: stageIds['proposta'],
      qualificationStatus: 'proposta_enviada',
      priority: 'media',
      score: 70,
      owners: [vendedor2?._id],
      notes: 'Proposta enviada. Aguardando retorno da empresária.'
    },
    {
      name: 'Dr. Ricardo Almeida',
      company: 'Clínica Bem Estar',
      email: 'adm@clinicabemestar.com.br',
      phone: '(41) 97777-6666',
      whatsapp: '(41) 97777-6666',
      hasCnpj: true,
      cnpj: '56.789.012/0001-34',
      cnpjType: 'ME',
      razaoSocial: 'Clínica Bem Estar Ltda',
      origin: 'Site',
      livesCount: 25,
      faixasEtarias: { ate18: 0, de19a23: 2, de24a28: 5, de29a33: 6, de34a38: 5, de39a43: 3, de44a48: 2, de49a53: 1, de54a58: 1, acima59: 0 },
      hasCurrentPlan: true,
      currentOperadora: 'SulAmérica',
      avgPrice: 490,
      valorProposta: 12250,
      state: 'PR',
      city: 'Curitiba',
      stageId: stageIds['negociacao'],
      qualificationStatus: 'negociacao',
      priority: 'alta',
      score: 85,
      owners: [vendedor1?._id],
      proximoContato: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      lembreteContato: 'Ligar para discutir valores de coparticipação',
      notes: 'Negociando desconto por conta da quantidade de vidas.'
    },
    {
      name: 'Gabriel Santos',
      company: 'Inova Startup',
      email: 'gabriel@inovastartup.io',
      phone: '(48) 99999-8888',
      whatsapp: '(48) 99999-8888',
      hasCnpj: true,
      cnpj: '67.890.123/0001-45',
      cnpjType: 'ME',
      origin: 'WhatsApp',
      livesCount: 12,
      faixasEtarias: { ate18: 0, de19a23: 3, de24a28: 5, de29a33: 3, de34a38: 1, de39a43: 0, de44a48: 0, de49a53: 0, de54a58: 0, acima59: 0 },
      hasCurrentPlan: false,
      avgPrice: 320,
      state: 'SC',
      city: 'Florianópolis',
      stageId: stageIds['novo'],
      qualificationStatus: 'novo',
      priority: 'media',
      score: 55,
      owners: [vendedor2?._id],
      notes: 'Startup de tecnologia. Time jovem. Interesse em plano básico.'
    },
    {
      name: 'Juliana Ferreira',
      company: 'Escritório JF Advocacia',
      email: 'juliana@jfadvocacia.com.br',
      phone: '(11) 3456-7890',
      hasCnpj: true,
      cnpj: '78.901.234/0001-56',
      cnpjType: 'ME',
      origin: 'Indicação',
      livesCount: 6,
      faixasEtarias: { ate18: 0, de19a23: 0, de24a28: 2, de29a33: 2, de34a38: 1, de39a43: 1, de44a48: 0, de49a53: 0, de54a58: 0, acima59: 0 },
      hasCurrentPlan: true,
      currentOperadora: 'Amil',
      avgPrice: 580,
      valorFechado: 3480,
      state: 'SP',
      city: 'São Paulo',
      stageId: stageIds['fechado_ganho'],
      qualificationStatus: 'fechado_ganho',
      priority: 'baixa',
      score: 100,
      owners: [vendedor1?._id],
      wonAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      notes: 'Venda fechada! Cliente indicou mais 2 escritórios parceiros.'
    },
    {
      name: 'Empresa XYZ',
      company: 'XYZ Comércio',
      email: 'contato@xyzcomercio.com',
      phone: '(85) 3333-2222',
      hasCnpj: true,
      cnpj: '89.012.345/0001-67',
      cnpjType: 'EPP',
      origin: 'Meta Ads',
      livesCount: 20,
      hasCurrentPlan: true,
      currentOperadora: 'Hapvida',
      avgPrice: 250,
      state: 'CE',
      city: 'Fortaleza',
      stageId: stageIds['fechado_perdido'],
      qualificationStatus: 'fechado_perdido',
      lostReason: 'Preço acima do orçamento',
      priority: 'baixa',
      score: 0,
      owners: [vendedor2?._id],
      lostAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      notes: 'Cliente optou por manter plano atual com Hapvida devido ao preço.'
    }
  ];

  let rank = 0;
  for (const lead of demoLeads) {
    rank++;
    await LeadModel.create({
      ...lead,
      pipelineId: pipeline._id,
      rank: `0|h${String(rank).padStart(5, '0')}:`,
      createdBy: adminUser?._id,
      lastActivityAt: new Date()
    });
  }

  // ==========================================
  // 5. SEED DE APÓLICES
  // ==========================================
  console.log('📋 Criando Apólices de demonstração...');

  const leadJuliana = await LeadModel.findOne({ company: 'Escritório JF Advocacia' });

  const demoApolices = [
    {
      numeroApolice: 'AP2024000001',
      leadId: leadJuliana?._id,
      empresaNome: 'Escritório JF Advocacia',
      empresaCnpj: '78.901.234/0001-56',
      operadora: 'Porto Seguro Saúde',
      tipoPlano: 'empresarial',
      nomePlano: 'Porto PME Essencial',
      coparticipacao: true,
      dataInicio: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      dataVencimento: new Date(Date.now() + 358 * 24 * 60 * 60 * 1000),
      valorMensal: 3480,
      comissao: 348,
      percentualComissao: 10,
      titularNome: 'Juliana Ferreira',
      titularCpf: '123.456.789-00',
      titularEmail: 'juliana@jfadvocacia.com.br',
      titularTelefone: '(11) 3456-7890',
      quantidadeVidas: 6,
      faixasEtarias: { ate18: 0, de19a23: 0, de24a28: 2, de29a33: 2, de34a38: 1, de39a43: 1, de44a48: 0, de49a53: 0, de54a58: 0, acima59: 0 },
      status: 'ativa',
      vendedorId: vendedor1?._id,
      createdBy: adminUser?._id
    },
    {
      numeroApolice: 'AP2023000045',
      empresaNome: 'Restaurante Sabor & Arte',
      empresaCnpj: '11.222.333/0001-44',
      operadora: 'Unimed',
      tipoPlano: 'pme',
      nomePlano: 'Unimed PME Flex',
      coparticipacao: false,
      dataInicio: new Date(Date.now() - 335 * 24 * 60 * 60 * 1000),
      dataVencimento: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
      valorMensal: 5200,
      comissao: 520,
      percentualComissao: 10,
      titularNome: 'José Roberto',
      titularCpf: '987.654.321-00',
      titularTelefone: '(11) 98765-4321',
      quantidadeVidas: 14,
      status: 'vencendo',
      vendedorId: vendedor2?._id,
      createdBy: adminUser?._id,
      observacoes: 'Contato para renovação agendado para próxima semana'
    },
    {
      numeroApolice: 'AP2023000032',
      empresaNome: 'Academia Power Fit',
      empresaCnpj: '22.333.444/0001-55',
      operadora: 'Bradesco Saúde',
      tipoPlano: 'empresarial',
      nomePlano: 'Bradesco Nacional Flex',
      coparticipacao: true,
      dataInicio: new Date(Date.now() - 370 * 24 * 60 * 60 * 1000),
      dataVencimento: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      valorMensal: 8500,
      comissao: 850,
      percentualComissao: 10,
      titularNome: 'Marcos Antônio',
      titularCpf: '456.789.123-00',
      titularTelefone: '(21) 99876-5432',
      quantidadeVidas: 22,
      status: 'vencida',
      vendedorId: vendedor1?._id,
      createdBy: adminUser?._id,
      observacoes: 'URGENTE: Entrar em contato para renovação'
    }
  ];

  for (const apolice of demoApolices) {
    await ApoliceModel.create(apolice);
  }

  // ==========================================
  // 6. SEED DE ALERTAS
  // ==========================================
  console.log('🔔 Criando Alertas de demonstração...');

  const apoliceVencendo = await ApoliceModel.findOne({ numeroApolice: 'AP2023000045' });
  const apoliceVencida = await ApoliceModel.findOne({ numeroApolice: 'AP2023000032' });

  const demoAlerts = [
    {
      type: 'apolice_vencendo',
      title: 'Apólice próxima do vencimento',
      message: 'A apólice AP2023000045 de Restaurante Sabor & Arte vence em 25 dias.',
      priority: 'alta',
      userId: vendedor2?._id,
      apoliceId: apoliceVencendo?._id,
      status: 'ativo',
      actionUrl: `/apolices/${apoliceVencendo?._id}`,
      actionLabel: 'Ver Apólice'
    },
    {
      type: 'apolice_vencida',
      title: 'Apólice vencida - Ação urgente',
      message: 'A apólice AP2023000032 de Academia Power Fit está vencida há 5 dias!',
      priority: 'urgente',
      userId: vendedor1?._id,
      apoliceId: apoliceVencida?._id,
      status: 'ativo',
      actionUrl: `/apolices/${apoliceVencida?._id}`,
      actionLabel: 'Ver Apólice'
    },
    {
      type: 'apolice_vencida',
      title: 'Apólice vencida - Ação urgente',
      message: 'A apólice AP2023000032 de Academia Power Fit está vencida há 5 dias!',
      priority: 'urgente',
      userId: userMap.financeiro?._id,
      apoliceId: apoliceVencida?._id,
      status: 'ativo',
      actionUrl: `/apolices/${apoliceVencida?._id}`,
      actionLabel: 'Ver Apólice'
    },
    {
      type: 'lead_proximo_contato',
      title: 'Contato agendado',
      message: 'Você tem um contato agendado com Dr. Ricardo Almeida (Clínica Bem Estar).',
      priority: 'alta',
      userId: vendedor1?._id,
      status: 'ativo',
      actionLabel: 'Ver Lead'
    }
  ];

  for (const alert of demoAlerts) {
    if (alert.userId) {
      await AlertModel.create(alert);
    }
  }

  // ==========================================
  // FIM
  // ==========================================
  console.log('');
  console.log('✅ Seed concluído com sucesso!');
  console.log('');
  console.log('📧 Usuários criados:');
  console.log('   • admin@nautiluz.com / demo123 (Administrador)');
  console.log('   • vendas@nautiluz.com / demo123 (Vendedor)');
  console.log('   • vendas2@nautiluz.com / demo123 (Vendedor)');
  console.log('   • financeiro@nautiluz.com / demo123 (Financeiro)');
  console.log('');
  console.log(`📊 ${demoLeads.length} Leads criados`);
  console.log(`📋 ${demoApolices.length} Apólices criadas`);
  console.log(`🔔 ${demoAlerts.length} Alertas criados`);
  console.log('');

  await disconnectMongo();
}

seed().catch((err) => {
  console.error('❌ Erro no seed:', err);
  process.exit(1);
});
