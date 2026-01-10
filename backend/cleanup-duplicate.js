import './src/config/env.js';
import { connectMongo, disconnectMongo } from './src/database/mongoose.js';
import { UserModel } from './src/modules/users/user.model.js';

async function cleanupDuplicateUser() {
  await connectMongo();

  console.log('🔍 Buscando usuário duplicado...\n');

  const email = 'felipe.coqueiro@usp.br';
  const users = await UserModel.find({ email });

  if (users.length > 0) {
    console.log(`📧 Encontrados ${users.length} usuário(s) com email: ${email}\n`);

    for (const user of users) {
      console.log(`🗑️  Removendo:`);
      console.log(`   - ID: ${user._id}`);
      console.log(`   - Nome: ${user.name}`);
      console.log(`   - Role: ${user.role}\n`);

      await UserModel.findByIdAndDelete(user._id);
      console.log('✅ Removido!\n');
    }
  } else {
    console.log('✨ Nenhum usuário encontrado com esse email.\n');
  }

  await disconnectMongo();
  console.log('🎉 Limpeza concluída!');
  process.exit(0);
}

cleanupDuplicateUser().catch((err) => {
  console.error('❌ Erro:', err);
  process.exit(1);
});
