import { DataSource } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import * as bcrypt from 'bcrypt';

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

  // Função para criar um usuário com senha já hasheada
  const createUserWithPassword = async (login: string, password: string) => {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user without calling the entity's BeforeInsert hook
    return userRepository.create({
      login,
      password: hashedPassword,
    });
  };

  // Create sample users with passwords
  const adminUser = await createUserWithPassword('admin', 'admin123');

  const users = [
    adminUser,
    await createUserWithPassword('maria', 'senha123'),
    await createUserWithPassword('joao', 'senha123'),
    await createUserWithPassword('ana', 'senha123'),
    await createUserWithPassword('lucas', 'senha123'),
    await createUserWithPassword('pedro', 'senha123'),
  ];

  // Save users to database
  const savedUsers = await userRepository.save(users);
  console.log(
    `Seeded ${savedUsers.length} users, including admin user (${adminUser.id})`,
  );

  return savedUsers;
};
