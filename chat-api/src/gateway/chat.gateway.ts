import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MessagesService } from '../messages/messages.service';
import { RoomsService } from '../rooms/rooms.service';
import { UsersService } from '../users/users.service';
import { CreateMessageDto } from '../messages/dto/create-message.dto';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private readonly connectedClients: Map<string, string> = new Map();
  private readonly userSockets: Map<string, string[]> = new Map();

  constructor(
    private readonly messagesService: MessagesService,
    private readonly roomsService: RoomsService,
    private readonly usersService: UsersService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      // O usuário já foi autenticado por meio do adapter
      const user = client.data.user;
      if (user && user.sub) {
        // Armazenar o ID do usuário associado a este socket
        this.connectedClients.set(client.id, user.sub);

        // Associar este socket ao usuário (um usuário pode ter múltiplas conexões)
        const userSockets = this.userSockets.get(user.sub) || [];
        userSockets.push(client.id);
        this.userSockets.set(user.sub, userSockets);

        // Juntar-se ao canal privado do usuário
        client.join(`user-${user.sub}`);

        this.logger.log(
          `Cliente autenticado: ${client.id}, usuário: ${user.sub}`,
        );

        // Buscar salas do usuário e entrar nos canais correspondentes
        const userObj = await this.usersService.findOne(user.sub);
        if (userObj.rooms) {
          userObj.rooms.forEach((room) => {
            client.join(`room-${room.id}`);
            this.logger.log(`Usuário ${user.sub} entrou na sala ${room.id}`);
          });
        }

        // Notificar que o usuário está online
        this.server.emit('userConnected', { userId: user.sub });

        // Enviar lista de salas do usuário
        client.emit('rooms', userObj.rooms || []);
      } else {
        this.logger.warn(`Conexão sem autenticação: ${client.id}`);
        client.disconnect();
      }
    } catch (error) {
      this.logger.error(`Erro na conexão: ${error.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = this.connectedClients.get(client.id);
    if (userId) {
      this.logger.log(`Cliente desconectado: ${client.id}, usuário: ${userId}`);
      this.connectedClients.delete(client.id);

      // Remover este socket da lista do usuário
      const userSockets = this.userSockets.get(userId) || [];
      const updatedSockets = userSockets.filter((id) => id !== client.id);

      if (updatedSockets.length > 0) {
        this.userSockets.set(userId, updatedSockets);
      } else {
        // Se não houver mais sockets, o usuário está offline
        this.userSockets.delete(userId);
        // Notificar que o usuário está offline
        this.server.emit('userDisconnected', { userId });
      }
    } else {
      this.logger.log(`Cliente desconectado: ${client.id}`);
    }
  }

  @SubscribeMessage('getRooms')
  async getRooms(@ConnectedSocket() client: Socket) {
    try {
      const userId = this.getUserIdFromSocket(client);
      if (!userId) {
        throw new WsException('Usuário não autenticado');
      }

      const user = await this.usersService.findOne(userId);
      return {
        event: 'rooms',
        data: user.rooms || [],
      };
    } catch (error) {
      return {
        event: 'error',
        data: { message: error.message },
      };
    }
  }

  @SubscribeMessage('getAllRooms')
  async getAllRooms() {
    try {
      const rooms = await this.roomsService.findAll();
      return {
        event: 'allRooms',
        data: rooms,
      };
    } catch (error) {
      return {
        event: 'error',
        data: { message: error.message },
      };
    }
  }

  @SubscribeMessage('joinRoom')
  async joinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
  ) {
    try {
      const userId = this.getUserIdFromSocket(client);
      if (!userId) {
        throw new WsException('Usuário não autenticado');
      }

      const room = await this.roomsService.addUserToRoom(data.roomId, userId);

      // Juntar-se ao canal da sala
      client.join(`room-${data.roomId}`);

      // Notificar outros usuários na sala
      this.server.to(`room-${data.roomId}`).emit('userJoined', {
        roomId: data.roomId,
        userId: userId,
      });

      // Retornar informações da sala
      return {
        event: 'joinedRoom',
        data: { room },
      };
    } catch (error) {
      return {
        event: 'error',
        data: { message: error.message },
      };
    }
  }

  @SubscribeMessage('leaveRoom')
  async leaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
  ) {
    try {
      const userId = this.getUserIdFromSocket(client);
      if (!userId) {
        throw new WsException('Usuário não autenticado');
      }

      const room = await this.roomsService.removeUserFromRoom(
        data.roomId,
        userId,
      );

      // Sair do canal da sala
      client.leave(`room-${data.roomId}`);

      // Notificar outros usuários na sala
      this.server.to(`room-${data.roomId}`).emit('userLeft', {
        roomId: data.roomId,
        userId: userId,
      });

      // Retornar informações atualizadas da sala
      return {
        event: 'leftRoom',
        data: { room },
      };
    } catch (error) {
      return {
        event: 'error',
        data: { message: error.message },
      };
    }
  }

  @SubscribeMessage('sendDirectMessage')
  async sendDirectMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { receiverId: string; content: string },
  ) {
    try {
      const userId = this.getUserIdFromSocket(client);
      if (!userId) {
        throw new WsException('Usuário não autenticado');
      }

      const messageDto = new CreateMessageDto();
      messageDto.content = data.content;
      messageDto.senderId = userId;

      const message = await this.messagesService.createDirectMessage(
        data.receiverId,
        messageDto,
      );

      // Enviar para o destinatário
      this.server
        .to(`user-${data.receiverId}`)
        .emit('newDirectMessage', message);

      // Enviar confirmação para o remetente (se não for o próprio remetente)
      if (client.rooms.has(`user-${userId}`)) {
        this.server.to(`user-${userId}`).emit('messageSent', message);
      }

      return {
        event: 'messageSent',
        data: { message },
      };
    } catch (error) {
      return {
        event: 'error',
        data: { message: error.message },
      };
    }
  }

  @SubscribeMessage('sendRoomMessage')
  async sendRoomMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; content: string },
  ) {
    try {
      const userId = this.getUserIdFromSocket(client);
      if (!userId) {
        throw new WsException('Usuário não autenticado');
      }

      // Verificar se o usuário está na sala
      const room = await this.roomsService.findOne(data.roomId);
      if (room && room.users) {
        const isUserInRoom = room.users.some((user) => user.id === userId);

        if (!isUserInRoom) {
          throw new WsException('Usuário não está na sala');
        }
      } else {
        throw new WsException('Sala não encontrada');
      }

      const messageDto = new CreateMessageDto();
      messageDto.content = data.content;
      messageDto.senderId = userId;

      const message = await this.messagesService.createRoomMessage(
        data.roomId,
        messageDto,
      );

      // Enviar para todos na sala, incluindo o remetente
      this.server.to(`room-${data.roomId}`).emit('newRoomMessage', {
        roomId: data.roomId,
        message,
      });

      return {
        event: 'messageSent',
        data: { roomId: data.roomId, message },
      };
    } catch (error) {
      return {
        event: 'error',
        data: { message: error.message },
      };
    }
  }

  @SubscribeMessage('getRoomMessages')
  async getRoomMessages(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
  ) {
    try {
      const userId = this.getUserIdFromSocket(client);
      if (!userId) {
        throw new WsException('Usuário não autenticado');
      }

      const messages = await this.messagesService.getRoomMessages(data.roomId);

      return {
        event: 'roomMessages',
        data: { roomId: data.roomId, messages },
      };
    } catch (error) {
      return {
        event: 'error',
        data: { message: error.message },
      };
    }
  }

  @SubscribeMessage('getDirectMessages')
  async getDirectMessages(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { otherUserId: string },
  ) {
    try {
      const userId = this.getUserIdFromSocket(client);
      if (!userId) {
        throw new WsException('Usuário não autenticado');
      }

      // Obter mensagens diretas enviadas e recebidas com o outro usuário
      const messages = await this.messagesService.getDirectMessages(
        data.otherUserId,
      );

      // Filtrar para mostrar apenas mensagens entre esses dois usuários
      const filteredMessages = messages.filter(
        (msg) =>
          (msg.sender?.id === userId &&
            msg.receiver?.id === data.otherUserId) ||
          (msg.sender?.id === data.otherUserId && msg.receiver?.id === userId),
      );

      return {
        event: 'directMessages',
        data: { otherUserId: data.otherUserId, messages: filteredMessages },
      };
    } catch (error) {
      return {
        event: 'error',
        data: { message: error.message },
      };
    }
  }

  @SubscribeMessage('typing')
  handleTypingEvent(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId?: string; receiverId?: string },
  ) {
    try {
      const userId = this.getUserIdFromSocket(client);
      if (!userId) {
        throw new WsException('Usuário não autenticado');
      }

      if (data.roomId) {
        // Notificar digitação em sala
        client.to(`room-${data.roomId}`).emit('typing', {
          userId,
          roomId: data.roomId,
        });
      } else if (data.receiverId) {
        // Notificar digitação em mensagem direta
        this.server.to(`user-${data.receiverId}`).emit('typing', {
          userId,
          direct: true,
        });
      }

      return { status: 'ok' };
    } catch (error) {
      return {
        event: 'error',
        data: { message: error.message },
      };
    }
  }

  private getUserIdFromSocket(client: Socket): string | null {
    // Primeiro verificar se o usuário está autenticado através do token
    if (client.data.user && client.data.user.sub) {
      return client.data.user.sub;
    }

    // Fallback para o mapa de clientes conectados
    return this.connectedClients.get(client.id) || null;
  }
}
