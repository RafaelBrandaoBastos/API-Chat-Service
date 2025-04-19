import { IsString, Length, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginUserDto {
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
  @MinLength(6)
  @IsString()
  password: string;
}
