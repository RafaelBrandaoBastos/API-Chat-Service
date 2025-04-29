import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  JoinTable,
  OneToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Message } from '../../messages/entities/message.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

@Entity()
export class Room {
  @ApiProperty({
    description: 'Identificador único da sala',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Nome da sala de chat',
    example: 'Discussão Geral',
  })
  @Column()
  name: string;

  @ApiPropertyOptional({
    description: 'Descrição da sala de chat',
    example: 'Um lugar para discutir tópicos gerais',
  })
  @Column({ nullable: true })
  description: string;

  @ApiProperty({ description: 'Usuários na sala', type: [User] })
  @ManyToMany(() => User, (user) => user.rooms, {
    cascade: true,
  })
  @JoinTable()
  users: User[];

  @OneToMany(() => Message, (message) => message.room)
  messages: Message[];
}
