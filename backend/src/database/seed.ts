import '../config/env.js';
import { connectMongo, disconnectMongo } from './mongoose.js';
import { UserModel } from '../modules/users/user.model.js';
import { PipelineModel } from '../modules/pipelines/pipeline.model.js';
import { StageModel } from '../modules/pipelines/stage.model.js';
import { hashPassword } from '../auth/password.js';

async function seed() {
  await connectMongo();

  const adminEmail = 'admin@nautiluz.com';
  const adminExists = await UserModel.findOne({ email: adminEmail });
  if (!adminExists) {
    const passwordHash = await hashPassword('admin123');
    await UserModel.create({
      name: 'Administrador',
      email: adminEmail,
      passwordHash,
      role: 'admin',
      active: true
    });
    console.log('Admin created:', adminEmail);
  }

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

  await disconnectMongo();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
