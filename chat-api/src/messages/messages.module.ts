import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Message } from './entities/message.entity';
import { UsersModule } from '../users/users.module';
import { RoomsModule } from '../rooms/rooms.module';
import { MessagesService } from './messages.service';
import {
  MessagesController,
  RoomMessagesController,
} from './messages.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Message]), UsersModule, RoomsModule],
  controllers: [MessagesController, RoomMessagesController],
  providers: [MessagesService],
  exports: [MessagesService],
})
export class MessagesModule {}
