import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  NotFoundException,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { CreateRoomDto } from './dto/create-room.dto';
import { Room } from './entities/room.entity';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { RoomsService } from './rooms.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('rooms')
@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar uma nova sala de chat' })
  @ApiResponse({
    status: 201,
    description: 'Sala criada com sucesso',
    type: Room,
  })
  @Post()
  async create(@Body() createRoomDto: CreateRoomDto): Promise<Room> {
    return this.roomsService.create(createRoomDto);
  }

  @ApiOperation({ summary: 'Listar todas as salas de chat' })
  @ApiResponse({
    status: 200,
    description: 'Lista de todas as salas',
    type: [Room],
  })
  @Get()
  async findAll(): Promise<Room[]> {
    return this.roomsService.findAll();
  }

  @ApiOperation({ summary: 'Buscar uma sala específica por ID' })
  @ApiParam({ name: 'id', description: 'ID da sala a ser encontrada' })
  @ApiResponse({ status: 200, description: 'Sala encontrada', type: Room })
  @ApiResponse({ status: 404, description: 'Sala não encontrada' })
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Room> {
    const room = await this.roomsService.findOne(id);
    if (!room) {
      throw new NotFoundException(`Sala com ID ${id} não encontrada`);
    }
    return room;
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Excluir uma sala' })
  @ApiParam({ name: 'id', description: 'ID da sala a ser excluída' })
  @ApiResponse({ status: 200, description: 'Sala excluída com sucesso' })
  @ApiResponse({ status: 404, description: 'Sala não encontrada' })
  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return this.roomsService.remove(id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Adicionar um usuário a uma sala' })
  @ApiParam({ name: 'id', description: 'ID da sala' })
  @ApiBody({
    schema: {
      properties: {
        userId: {
          type: 'string',
          example: '123e4567-e89b-12d3-a456-426614174000',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Usuário adicionado à sala',
    type: Room,
  })
  @ApiResponse({ status: 400, description: 'Requisição inválida' })
  @ApiResponse({ status: 404, description: 'Sala ou usuário não encontrado' })
  @Post(':id/enter')
  async enterRoom(
    @Param('id') roomId: string,
    @Body('userId') userId: string,
  ): Promise<Room> {
    try {
      return await this.roomsService.addUserToRoom(roomId, userId);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remover um usuário de uma sala' })
  @ApiParam({ name: 'id', description: 'ID da sala' })
  @ApiBody({
    schema: {
      properties: {
        userId: {
          type: 'string',
          example: '123e4567-e89b-12d3-a456-426614174000',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Usuário removido da sala',
    type: Room,
  })
  @ApiResponse({ status: 400, description: 'Requisição inválida' })
  @ApiResponse({ status: 404, description: 'Sala ou usuário não encontrado' })
  @Post(':id/leave')
  async leaveRoom(
    @Param('id') roomId: string,
    @Body('userId') userId: string,
  ): Promise<Room> {
    try {
      return await this.roomsService.removeUserFromRoom(roomId, userId);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Remover um usuário de uma sala (endpoint alternativo)',
  })
  @ApiParam({ name: 'roomId', description: 'ID da sala' })
  @ApiParam({ name: 'userId', description: 'ID do usuário a ser removido' })
  @ApiResponse({
    status: 200,
    description: 'Usuário removido da sala',
    type: Room,
  })
  @ApiResponse({ status: 400, description: 'Requisição inválida' })
  @ApiResponse({
    status: 404,
    description: 'Sala ou usuário não encontrado na sala',
  })
  @Delete(':roomId/users/:userId')
  async removeUserFromRoom(
    @Param('roomId') roomId: string,
    @Param('userId') userId: string,
  ): Promise<Room> {
    try {
      return await this.roomsService.removeUserFromRoom(roomId, userId);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
