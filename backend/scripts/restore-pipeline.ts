// Script para verificar e restaurar pipeline padrão
import '../src/config/env.js';
import { connectMongo, disconnectMongo } from '../src/database/mongoose.js';
import { PipelineModel } from '../src/modules/pipelines/pipeline.model.js';
import { StageModel } from '../src/modules/pipelines/stage.model.js';

async function restorePipeline() {
  console.log('🔍 Verificando pipeline no banco de dados...');
  await connectMongo();

  try {
    // Verifica se existe pipeline
    const existingPipeline = await PipelineModel.findOne();
    
    if (existingPipeline) {
      console.log('✅ Pipeline encontrado:', existingPipeline.name);
      console.log('   ID:', existingPipeline._id);
      
      // Verifica stages
      const stages = await StageModel.find({ pipelineId: existingPipeline._id }).sort({ order: 1 });
      console.log(`   Stages: ${stages.length} etapas`);
      
      if (stages.length === 0) {
        console.log('⚠️  Pipeline sem etapas! Criando etapas padrão...');
        await createDefaultStages(existingPipeline._id);
      } else {
        stages.forEach(stage => {
          console.log(`     - ${stage.name} (ordem: ${stage.order})`);
        });
      }
      
      console.log('\n✨ Pipeline está OK!');
    } else {
      console.log('❌ Nenhum pipeline encontrado no banco de dados!');
      console.log('🔧 Criando pipeline padrão...');
      
      const newPipeline = await PipelineModel.create({ 
        name: 'Pipeline de Vendas', 
        key: 'default',
        description: 'Pipeline principal para gestão de vendas de planos de saúde'
      });
      
      console.log('✅ Pipeline criado:', newPipeline.name);
      console.log('   ID:', newPipeline._id);
      
      await createDefaultStages(newPipeline._id);
      
      console.log('\n✨ Pipeline restaurado com sucesso!');
    }
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await disconnectMongo();
  }
}

async function createDefaultStages(pipelineId: any) {
  const stagesData = [
    { name: 'Novo Lead', order: 1, key: 'novo', color: '#3B82F6', sla: 24 },
    { name: 'Qualificação', order: 2, key: 'qualificacao', color: '#8B5CF6', sla: 48 },
    { name: 'Cotação', order: 3, key: 'cotacao', color: '#F59E0B', sla: 72 },
    { name: 'Proposta Enviada', order: 4, key: 'proposta', color: '#EF4444', sla: 96 },
    { name: 'Negociação', order: 5, key: 'negociacao', color: '#F97316', sla: 120 },
    { name: 'Fechado Ganho', order: 6, key: 'fechado_ganho', color: '#10B981', sla: 0 },
    { name: 'Fechado Perdido', order: 7, key: 'fechado_perdido', color: '#6B7280', sla: 0 }
  ];

  console.log('📋 Criando etapas...');
  
  for (const s of stagesData) {
    const stage = await StageModel.create({ ...s, pipelineId });
    console.log(`   ✅ ${stage.name} (ordem: ${stage.order})`);
  }
}

restorePipeline();
