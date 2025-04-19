import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Room } from '../../rooms/entities/room.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

@Entity()
export class Message {
  @ApiProperty({
    description: 'Identificador único da mensagem',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Conteúdo da mensagem',
    example: 'Olá, como você está?',
  })
  @Column()
  content: string;

  @ApiProperty({ description: 'Data e hora em que a mensagem foi criada' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({
    description: 'Usuário que enviou a mensagem',
    type: () => User,
  })
  @ManyToOne(() => User)
  sender: User;

  @ApiPropertyOptional({
    description:
      'Sala onde a mensagem foi enviada (nulo para mensagens diretas)',
    type: () => Room,
  })
  @ManyToOne(() => Room, (room) => room.messages, { nullable: true })
  room: Room;

  @ApiPropertyOptional({
    description: 'Usuário que recebeu a mensagem (nulo para mensagens de sala)',
    type: () => User,
  })
  @ManyToOne(() => User, { nullable: true })
  receiver: User;
}
