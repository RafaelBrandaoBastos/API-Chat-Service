import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Room } from './entities/room.entity';
import { User } from '../users/entities/user.entity';
import { CreateRoomDto } from './dto/create-room.dto';
import { UsersService } from '../users/users.service';

@Injectable()
export class RoomsService {
  constructor(
    @InjectRepository(Room)
    private roomsRepository: Repository<Room>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private usersService: UsersService,
  ) {}

  async create(createRoomDto: CreateRoomDto): Promise<Room> {
    const newRoom = this.roomsRepository.create(createRoomDto);
    return this.roomsRepository.save(newRoom);
  }

  async findAll(): Promise<Room[]> {
    return this.roomsRepository.find({ relations: ['users'] });
  }

  async findOne(id: string): Promise<Room | null> {
    return this.roomsRepository.findOne({
      where: { id },
      relations: ['users'],
    });
  }

  async remove(id: string): Promise<void> {
    const result = await this.roomsRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Room with ID ${id} not found`);
    }
  }

  async addUserToRoom(roomId: string, userId: string): Promise<Room> {
    const room = await this.findOne(roomId);
    if (!room) {
      throw new NotFoundException(`Room with ID ${roomId} not found`);
    }

    const user = await this.usersService.findOne(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Check if user is already in the room
    if (room.users && room.users.some((u) => u.id === userId)) {
      return room; // User is already in the room, just return the room
    }

    // Initialize users array if it doesn't exist
    if (!room.users) {
      room.users = [];
    }

    room.users.push(user);
    return this.roomsRepository.save(room);
  }

  async removeUserFromRoom(roomId: string, userId: string): Promise<Room> {
    const room = await this.findOne(roomId);
    if (!room) {
      throw new NotFoundException(`Room with ID ${roomId} not found`);
    }

    if (!room.users) {
      throw new NotFoundException(`No users in room with ID ${roomId}`);
    }

    const userIndex = room.users.findIndex((u) => u.id === userId);
    if (userIndex === -1) {
      throw new NotFoundException(`User with ID ${userId} not found in room`);
    }

    room.users.splice(userIndex, 1);
    return this.roomsRepository.save(room);
  }
}
