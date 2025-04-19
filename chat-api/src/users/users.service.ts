import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { RegisterUserDto } from './dto/register-user.dto';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private repo: Repository<User>) {}

  async create(dto: RegisterUserDto) {
    const exists = await this.repo.findOne({ where: { login: dto.login } });
    if (exists) throw new BadRequestException('Login indisponível');
    return this.repo.save(this.repo.create(dto));
  }

  async login(dto: LoginUserDto) {
    const user = await this.repo.findOne({ where: { login: dto.login } });
    if (!user) throw new NotFoundException('Usuário não existe');
    return user;
  }

  async findOne(id: string) {
    const user = await this.repo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    return user;
  }

  async findByLogin(login: string) {
    return this.repo.findOne({
      where: { login },
      select: ['id', 'login', 'password'],
    });
  }
}
