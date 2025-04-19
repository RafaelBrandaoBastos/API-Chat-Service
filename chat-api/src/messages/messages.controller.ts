import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { CreateMessageDto } from './dto/create-message.dto';
import { Message } from './entities/message.entity';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('messages')
@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Enviar uma mensagem direta para outro usuário' })
  @ApiParam({ name: 'receiverId', description: 'ID do usuário destinatário' })
  @ApiResponse({
    status: 201,
    description: 'Mensagem enviada com sucesso',
    type: Message,
  })
  @ApiResponse({ status: 400, description: 'Requisição inválida' })
  @ApiResponse({
    status: 404,
    description: 'Remetente ou destinatário não encontrado',
  })
  @Post('direct/:receiverId')
  async sendDirectMessage(
    @Param('receiverId') receiverId: string,
    @Body() createMessageDto: CreateMessageDto,
  ): Promise<Message> {
    try {
      return await this.messagesService.createDirectMessage(
        receiverId,
        createMessageDto,
      );
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obter mensagens diretas de um usuário' })
  @ApiParam({ name: 'userId', description: 'ID do usuário' })
  @ApiResponse({
    status: 200,
    description: 'Lista de mensagens',
    type: [Message],
  })
  @Get('direct/:userId')
  async getDirectMessages(@Param('userId') userId: string): Promise<Message[]> {
    return this.messagesService.getDirectMessages(userId);
  }
}

@ApiTags('room-messages')
@Controller('rooms/:roomId/messages')
export class RoomMessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Enviar uma mensagem para uma sala' })
  @ApiParam({ name: 'roomId', description: 'ID da sala' })
  @ApiResponse({
    status: 201,
    description: 'Mensagem enviada com sucesso',
    type: Message,
  })
  @ApiResponse({ status: 400, description: 'Requisição inválida' })
  @ApiResponse({
    status: 404,
    description: 'Sala não encontrada ou usuário não está na sala',
  })
  @Post()
  async sendRoomMessage(
    @Param('roomId') roomId: string,
    @Body() createMessageDto: CreateMessageDto,
  ): Promise<Message> {
    try {
      return await this.messagesService.createRoomMessage(
        roomId,
        createMessageDto,
      );
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obter mensagens de uma sala' })
  @ApiParam({ name: 'roomId', description: 'ID da sala' })
  @ApiResponse({
    status: 200,
    description: 'Lista de mensagens',
    type: [Message],
  })
  @ApiResponse({ status: 404, description: 'Sala não encontrada' })
  @Get()
  async getRoomMessages(@Param('roomId') roomId: string): Promise<Message[]> {
    return this.messagesService.getRoomMessages(roomId);
  }
}
