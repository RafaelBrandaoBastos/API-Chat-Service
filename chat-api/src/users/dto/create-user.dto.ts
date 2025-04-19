import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    description: 'Nome de usuário para login',
    example: 'teste_usuario',
  })
  @Length(3, 20)
  @IsString()
  login: string;

  @ApiProperty({
    description: 'Senha do usuário',
    example: 'senha123',
  })
  @Length(6, 20)
  @IsString()
  password: string;
}
