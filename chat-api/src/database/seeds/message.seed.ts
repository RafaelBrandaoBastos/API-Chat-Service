import { DataSource } from 'typeorm';
import { Message } from '../../messages/entities/message.entity';
import { User } from '../../users/entities/user.entity';
import { Room } from '../../rooms/entities/room.entity';

export const seedMessages = async (
  dataSource: DataSource,
  users: User[],
  rooms: Room[],
): Promise<void> => {
  const messageRepository = dataSource.getRepository(Message);

  // Verificar mensagens existentes
  const messageCount = await messageRepository.count();
  if (messageCount > 0) {
    console.log(
      `Encontradas ${messageCount} mensagens existentes, mantendo-as.`,
    );
    return;
  }

  // Criar mensagens de sala
  const roomMessages = [
    // Mensagens na sala 'Geral'
    messageRepository.create({
      content: 'Olá pessoal! Tudo bem com vocês?',
      sender: users[0],
      room: rooms[0],
    }),
    messageRepository.create({
      content: 'Oi Maria! Tudo ótimo por aqui :)',
      sender: users[1],
      room: rooms[0],
    }),
    messageRepository.create({
      content: 'Alguém tem planos para o fim de semana?',
      sender: users[2],
      room: rooms[0],
    }),

    // Mensagens na sala 'Tecnologia'
    messageRepository.create({
      content: 'Vocês viram o novo lançamento da Apple?',
      sender: users[0],
      room: rooms[1],
    }),
    messageRepository.create({
      content: 'Sim, estou pensando em comprar!',
      sender: users[3],
      room: rooms[1],
    }),

    // Mensagens na sala 'Esportes'
    messageRepository.create({
      content: 'Quem vai assistir ao jogo hoje?',
      sender: users[1],
      room: rooms[2],
    }),
    messageRepository.create({
      content: 'Eu vou! Quem acha que vai ganhar?',
      sender: users[4],
      room: rooms[2],
    }),

    // Mensagens na sala 'Cinema'
    messageRepository.create({
      content: 'Alguém já assistiu ao novo filme da Marvel?',
      sender: users[0],
      room: rooms[3],
    }),
    messageRepository.create({
      content: 'Ainda não, mas estou planejando ver este fim de semana!',
      sender: users[3],
      room: rooms[3],
    }),
  ];

  // Criar mensagens diretas
  const directMessages = [
    // Mensagens diretas entre Maria e João
    messageRepository.create({
      content: 'Oi João, como vai o projeto?',
      sender: users[0], // Maria
      receiver: users[1], // João
    }),
    messageRepository.create({
      content: 'Oi Maria! Está indo bem, terminando os últimos detalhes',
      sender: users[1], // João
      receiver: users[0], // Maria
    }),

    // Mensagens diretas entre Ana e Lucas
    messageRepository.create({
      content: 'Lucas, você viu o email que enviei?',
      sender: users[2], // Ana
      receiver: users[3], // Lucas
    }),
    messageRepository.create({
      content: 'Vi sim, Ana! Vou responder ainda hoje',
      sender: users[3], // Lucas
      receiver: users[2], // Ana
    }),

    // Mensagens diretas entre Pedro e Maria
    messageRepository.create({
      content: 'Maria, podemos marcar uma reunião amanhã?',
      sender: users[4], // Pedro
      receiver: users[0], // Maria
    }),
    messageRepository.create({
      content: 'Claro Pedro! Que tal às 10h?',
      sender: users[0], // Maria
      receiver: users[4], // Pedro
    }),
  ];

  // Save all messages to database
  const allMessages = [...roomMessages, ...directMessages];
  await messageRepository.save(allMessages);

  console.log(
    `Seeded ${roomMessages.length} room messages and ${directMessages.length} direct messages`,
  );
};
