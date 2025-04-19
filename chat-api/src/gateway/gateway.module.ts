import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { MessagesModule } from '../messages/messages.module';
import { RoomsModule } from '../rooms/rooms.module';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [MessagesModule, RoomsModule, UsersModule, AuthModule],
  providers: [ChatGateway],
  exports: [ChatGateway],
})
export class GatewayModule {}
