import mongoose from 'mongoose';
import { connectMongo, disconnectMongo } from './src/database/mongoose.js';
import { ActivityModel, Activity } from './src/modules/leads/activity.model.js';
import { LeadModel } from './src/modules/leads/lead.model.js';
import { PipelineModel } from './src/modules/pipelines/pipeline.model.js';
import { StageModel } from './src/modules/pipelines/stage.model.js';
import { Types } from 'mongoose';
import { UserModel } from './src/modules/users/user.model.js';

async function testActivityModel() {
  try {
    console.log('🔌 Conectando ao MongoDB...');
    await connectMongo();
    console.log('✅ Conectado com sucesso!\n');

    // Limpar dados de teste anteriores
    console.log('🧹 Limpando dados de teste anteriores...');
    await ActivityModel.deleteMany({});
    await LeadModel.deleteMany({});
    await PipelineModel.deleteMany({});
    await StageModel.deleteMany({});
    console.log('✅ Dados limpos!\n');

    // Criar dados de teste necessários
    console.log('📝 Criando dados de teste (Pipeline, Stage, Lead)...');
    
    const pipeline = await PipelineModel.create({
      name: 'Pipeline de Teste',
      key: 'test-pipeline-' + Date.now(),
      description: 'Pipeline para testes do ActivityModel'
    });

    const stage = await StageModel.create({
      pipelineId: pipeline._id,
      name: 'Estágio de Teste',
      key: 'test-stage-' + Date.now(),
      order: 0
    });

    const lead = await LeadModel.create({
      name: 'Lead de Teste',
      origin: 'teste',
      pipelineId: pipeline._id,
      stageId: stage._id,
      rank: 'A'
    });

    console.log('✅ Dados criados!');
    console.log(`   - Pipeline ID: ${pipeline._id}`);
    console.log(`   - Stage ID: ${stage._id}`);
    console.log(`   - Lead ID: ${lead._id}\n`);

    // Teste 1: Criar uma atividade básica
    console.log('📋 Teste 1: Criar atividade básica');
    const activity1 = await ActivityModel.create({
      leadId: lead._id,
      type: 'view',
      payload: { source: 'kanban' }
    });
    console.log('✅ Atividade criada:', {
      id: activity1._id,
      type: activity1.type,
      leadId: activity1.leadId,
      payload: activity1.payload
    });
    console.log('   Timestamps:', {
      createdAt: activity1.createdAt,
      updatedAt: activity1.updatedAt
    });
    console.log('');

// Teste 2: Criar atividade com userId e ip
    console.log('📋 Teste 2: Criar atividade com userId e ip');
    
    // --- CORREÇÃO AQUI ---
    const user = await UserModel.create({
      name: 'Usuário Teste',
      email: 'teste_activity@exemplo.com',
      // Passamos 'passwordHash' direto (simulando uma senha já criptografada)
      passwordHash: '$2b$10$ExemploDeHashDeSenhaFalsaParaTeste123', 
      // Passamos o 'role' (assumindo que seja 'admin' ou 'user')
      role: 'admin' 
    });
    // ---------------------

    const activity2 = await ActivityModel.create({
      leadId: lead._id,
      type: 'update',
      payload: { field: 'name', oldValue: 'Antigo', newValue: 'Novo' },
      userId: user._id,
      ip: '192.168.1.1'
    });

    // Teste 3: Criar múltiplas atividades
    console.log('📋 Teste 3: Criar múltiplas atividades');
    const activities = await ActivityModel.insertMany([
      {
        leadId: lead._id,
        type: 'comment',
        payload: { text: 'Primeiro comentário' }
      },
      {
        leadId: lead._id,
        type: 'status_change',
        payload: { from: 'new', to: 'contacted' }
      },
      {
        leadId: lead._id,
        type: 'attachment',
        payload: { filename: 'documento.pdf', size: 1024 }
      }
    ]);
    console.log(`✅ ${activities.length} atividades criadas`);
    console.log('');

    // Teste 4: Buscar atividades por leadId
    console.log('📋 Teste 4: Buscar atividades por leadId');
    const leadActivities = await ActivityModel.find({ leadId: lead._id }).sort({ createdAt: -1 });
    console.log(`✅ Encontradas ${leadActivities.length} atividades para o lead`);
    leadActivities.forEach((act, index) => {
      console.log(`   ${index + 1}. ${act.type} - ${act.createdAt?.toISOString()}`);
    });
    console.log('');

    // Teste 5: Buscar atividades por tipo
    console.log('📋 Teste 5: Buscar atividades por tipo');
    const viewActivities = await ActivityModel.find({ type: 'view' });
    console.log(`✅ Encontradas ${viewActivities.length} atividades do tipo 'view'`);
    console.log('');

   // Teste 6: Buscar atividade com referências
    console.log('📋 Teste 6: Buscar atividade com referências');
    
    // Removido .populate('userId') porque o usuário não existe
    const activityWithRefs = await ActivityModel.findOne({ _id: activity2._id })
      .populate('leadId', 'name'); 

    console.log('✅ Atividade com referências:', {
      id: activityWithRefs?._id,
      type: activityWithRefs?.type,
      leadName: (activityWithRefs?.leadId as any)?.name, // Mostra o nome do lead
      user: activityWithRefs?.userId // Vai aparecer apenas o ID ou null
    });
    console.log('');

    // Teste 7: Contar atividades
    console.log('📋 Teste 7: Contar atividades');
    const totalActivities = await ActivityModel.countDocuments({ leadId: lead._id });
    console.log(`✅ Total de atividades para o lead: ${totalActivities}`);
    console.log('');

    // Teste 8: Atualizar atividade
    console.log('📋 Teste 8: Atualizar atividade');
    const updatedActivity = await ActivityModel.findByIdAndUpdate(
      activity1._id,
      { payload: { source: 'kanban', updated: true } },
      { new: true }
    );
    console.log('✅ Atividade atualizada:', {
      id: updatedActivity?._id,
      payload: updatedActivity?.payload,
      updatedAt: updatedActivity?.updatedAt
    });
    console.log('');

    // Teste 9: Deletar atividade
    console.log('📋 Teste 9: Deletar atividade');
    const deletedActivity = await ActivityModel.findByIdAndDelete(activities[0]._id);
    console.log('✅ Atividade deletada:', deletedActivity?._id);
    const remainingCount = await ActivityModel.countDocuments({ leadId: lead._id });
    console.log(`   Atividades restantes: ${remainingCount}`);
    console.log('');

    // Teste 10: Validação - tentar criar atividade sem leadId (deve falhar)
    console.log('📋 Teste 10: Validação - atividade sem leadId (deve falhar)');
    try {
      await ActivityModel.create({
        type: 'test'
        // leadId ausente
      });
      console.log('❌ ERRO: Deveria ter falhado!');
    } catch (error: any) {
      console.log('✅ Validação funcionou corretamente:', error.message);
    }
    console.log('');

    // Teste 11: Validação - tentar criar atividade sem type (deve falhar)
    console.log('📋 Teste 11: Validação - atividade sem type (deve falhar)');
    try {
      await ActivityModel.create({
        leadId: lead._id
        // type ausente
      });
      console.log('❌ ERRO: Deveria ter falhado!');
    } catch (error: any) {
      console.log('✅ Validação funcionou corretamente:', error.message);
    }
    console.log('');

    // Teste 12: Buscar atividades com filtros complexos
    console.log('📋 Teste 12: Buscar atividades com filtros complexos');
    const filteredActivities = await ActivityModel.find({
      leadId: lead._id,
      type: { $in: ['comment', 'status_change'] },
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // últimas 24h
    });
    console.log(`✅ Encontradas ${filteredActivities.length} atividades com filtros aplicados`);
    console.log('');

    // Teste 13: Agregação - contar atividades por tipo
    console.log('📋 Teste 13: Agregação - contar atividades por tipo');
    const activitiesByType = await ActivityModel.aggregate([
      { $match: { leadId: lead._id } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    console.log('✅ Atividades por tipo:');
    activitiesByType.forEach(item => {
      console.log(`   ${item._id}: ${item.count}`);
    });
    console.log('');

    // Limpar dados de teste
    console.log('🧹 Limpando dados de teste...');
    await ActivityModel.deleteMany({});
    await LeadModel.deleteMany({});
    await PipelineModel.deleteMany({});
    await StageModel.deleteMany({});
    console.log('✅ Dados limpos!\n');

    console.log('✅ Todos os testes passaram com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro durante os testes:', error);
    throw error;
  } finally {
    await disconnectMongo();
    console.log('🔌 Desconectado do MongoDB');
  }
}

// Executar os testes
testActivityModel()
  .then(() => {
    console.log('\n🎉 Testes concluídos!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Falha nos testes:', error);
    process.exit(1);
  });

