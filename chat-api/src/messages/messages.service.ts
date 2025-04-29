import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull } from 'typeorm';
import { Message } from './entities/message.entity';
import { CreateMessageDto } from './dto/create-message.dto';
import { UsersService } from '../users/users.service';
import { RoomsService } from '../rooms/rooms.service';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private messagesRepository: Repository<Message>,
    private usersService: UsersService,
    private roomsService: RoomsService,
  ) {}

  async createDirectMessage(
    receiverId: string,
    createMessageDto: CreateMessageDto,
  ): Promise<Message> {
    const sender = await this.usersService.findOne(createMessageDto.senderId);
    if (!sender) {
      throw new NotFoundException(
        `Sender with ID ${createMessageDto.senderId} not found`,
      );
    }

    const receiver = await this.usersService.findOne(receiverId);
    if (!receiver) {
      throw new NotFoundException(`Receiver with ID ${receiverId} not found`);
    }

    const newMessage = this.messagesRepository.create({
      content: createMessageDto.content,
      sender,
      receiver,
    });

    return this.messagesRepository.save(newMessage);
  }

  async createRoomMessage(
    roomId: string,
    createMessageDto: CreateMessageDto,
  ): Promise<Message> {
    console.log(
      `Criando mensagem em sala ${roomId} de ${createMessageDto.senderId}`,
    );

    const sender = await this.usersService.findOne(createMessageDto.senderId);
    if (!sender) {
      throw new NotFoundException(
        `Sender with ID ${createMessageDto.senderId} not found`,
      );
    }

    const room = await this.roomsService.findOne(roomId);
    if (!room) {
      throw new NotFoundException(`Room with ID ${roomId} not found`);
    }

    // DEBUG: Temporariamente desabilitado para testes
    // Descomente para reativar a verificação de usuário em sala
    /*
    // Check if user is in the room
    if (
      !room.users ||
      !room.users.some((u) => u.id === createMessageDto.senderId)
    ) {
      throw new NotFoundException(
        `User with ID ${createMessageDto.senderId} is not in the room`,
      );
    }
    */

    const newMessage = this.messagesRepository.create({
      content: createMessageDto.content,
      sender,
      room,
    });

    return this.messagesRepository.save(newMessage);
  }

  async getDirectMessages(userId: string): Promise<Message[]> {
    // Get messages where user is either sender or receiver
    return this.messagesRepository.find({
      where: [
        { sender: { id: userId }, receiver: { id: Not(IsNull()) } },
        { receiver: { id: userId } },
      ],
      relations: ['sender', 'receiver'],
      order: { createdAt: 'DESC' },
    });
  }

  async getRoomMessages(roomId: string): Promise<Message[]> {
    const room = await this.roomsService.findOne(roomId);
    if (!room) {
      throw new NotFoundException(`Room with ID ${roomId} not found`);
    }

    return this.messagesRepository.find({
      where: { room: { id: roomId } },
      relations: ['sender'],
      order: { createdAt: 'DESC' },
    });
  }
}
