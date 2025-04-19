import { DataSource } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export const seedUsers = async (dataSource: DataSource): Promise<User[]> => {
  const userRepository = dataSource.getRepository(User);

  // Verificar usuários existentes
  const existingUsers = await userRepository.find();
  if (existingUsers.length > 0) {
    console.log(
      `Encontrados ${existingUsers.length} usuários existentes, mantendo-os.`,
    );
    return existingUsers;
  }

  // Create sample users
  const users = [
    userRepository.create({ login: 'maria' }),
    userRepository.create({ login: 'joao' }),
    userRepository.create({ login: 'ana' }),
    userRepository.create({ login: 'lucas' }),
    userRepository.create({ login: 'pedro' }),
  ];

  // Save users to database
  const savedUsers = await userRepository.save(users);
  console.log(`Seeded ${savedUsers.length} users`);

  return savedUsers;
};
