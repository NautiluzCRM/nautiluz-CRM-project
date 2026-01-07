import '../config/env.js';
import { connectMongo, disconnectMongo } from './mongoose.js';
import { UserModel } from '../modules/users/user.model.js';
import { hashPassword } from '../auth/password.js';


async function seedUsers() {
  await connectMongo();

  const defaultPassword = 'senha123';

  const users = [
    {
      name: 'Administrador',
      email: 'admin@nautiluz.com',
      role: 'admin' as const,
      jobTitle: 'Administrador do Sistema'
    },
    {
      name: 'Vendedor Júnior',
      email: 'vendedor.junior@nautiluz.com',
      role: 'vendedor' as const,
      jobTitle: 'Vendedor Júnior - Leads Pequenos'
    },
    {
      name: 'Vendedor Sênior',
      email: 'vendedor.senior@nautiluz.com',
      role: 'vendedor' as const,
      jobTitle: 'Vendedor Sênior - Leads Grandes'
    }
  ];

  console.log('\nCriando usuários iniciais...\n');

  for (const userData of users) {
    const passwordHash = await hashPassword(defaultPassword);
    
    const user = await UserModel.findOneAndUpdate(
      { email: userData.email },
      {
        $set: {
          name: userData.name,
          email: userData.email,
          passwordHash,
          role: userData.role,
          jobTitle: userData.jobTitle,
          active: true
        }
      },
      { upsert: true, new: true }
    );

    console.log(`   ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   ID: ${user._id.toString()}`);
    console.log(`   Role: ${user.role}\n`);
  }

  console.log('Usuários criados com sucesso!');
  console.log('Senha padrão para todos: senha123\n');

  await disconnectMongo();
}

seedUsers().catch((err) => {
  console.error(err);
  process.exit(1);
});
