import { DataSource } from 'typeorm';
import { Room } from '../../rooms/entities/room.entity';
import { User } from '../../users/entities/user.entity';

export const seedRooms = async (
  dataSource: DataSource,
  users: User[],
): Promise<Room[]> => {
  const roomRepository = dataSource.getRepository(Room);

  // Verificar salas existentes
  const existingRooms = await roomRepository.find({ relations: ['users'] });
  if (existingRooms.length > 0) {
    console.log(
      `Encontradas ${existingRooms.length} salas existentes, mantendo-as.`,
    );
    return existingRooms;
  }

  // Criar salas de exemplo
  const rooms = [
    roomRepository.create({
      name: 'Geral',
      description: 'Canal para discussões gerais',
      users: [users[0], users[1], users[2], users[3], users[4]],
    }),
    roomRepository.create({
      name: 'Tecnologia',
      description: 'Discussões sobre tecnologia',
      users: [users[0], users[1], users[3]],
    }),
    roomRepository.create({
      name: 'Esportes',
      description: 'Discussões sobre esportes',
      users: [users[1], users[2], users[4]],
    }),
    roomRepository.create({
      name: 'Cinema',
      description: 'Discussões sobre filmes e séries',
      users: [users[0], users[2], users[3], users[4]],
    }),
  ];

  // Save rooms to database
  const savedRooms = await roomRepository.save(rooms);
  console.log(`Seeded ${savedRooms.length} rooms`);

  return savedRooms;
};
