import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToMany,
  BeforeInsert,
} from 'typeorm';
import { Message } from '../../messages/entities/message.entity';
import { Room } from '../../rooms/entities/room.entity';
import { ApiProperty, ApiHideProperty } from '@nestjs/swagger';
import * as bcrypt from 'bcrypt';

@Entity()
export class User {
  @ApiProperty({
    description: 'Identificador único do usuário',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Nome de usuário único para login',
    example: 'teste_usuario',
  })
  @Column({ unique: true })
  login: string;

  @ApiHideProperty()
  @Column({ select: false })
  password: string;

  @BeforeInsert()
  async hashPassword() {
    if (this.password) {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    }
  }

  @OneToMany(() => Message, (message) => message.sender)
  sentMessages: Message[];

  @OneToMany(() => Message, (message) => message.receiver)
  receivedMessages: Message[];

  @ManyToMany(() => Room, (room) => room.users, {
    eager: true,
  })
  rooms: Room[];
}
