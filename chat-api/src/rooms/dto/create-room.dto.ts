import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRoomDto {
  @ApiProperty({
    description: 'Nome da sala de chat',
    example: 'Discussão Geral',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'Descrição da sala de chat',
    example: 'Um lugar para discutir tópicos gerais',
  })
  @IsOptional()
  @IsString()
  description?: string;
}
