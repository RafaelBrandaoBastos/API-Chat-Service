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
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private repo: Repository<User>) {}

  async create(dto: RegisterUserDto) {
    try {
      const exists = await this.repo.findOne({ where: { login: dto.login } });
      if (exists) throw new BadRequestException('Login indisponível');

      // Hash the password before saving
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(dto.password, salt);

      const user = this.repo.create({
        login: dto.login,
        password: hashedPassword,
      });

      return this.repo.save(user);
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async login(dto: LoginUserDto) {
    const user = await this.repo.findOne({ where: { login: dto.login } });
    if (!user) throw new NotFoundException('Usuário não existe');
    return user;
  }

  async findAll() {
    return this.repo.find({
      select: ['id', 'login'],
    });
  }

  async findOne(id: string) {
    const user = await this.repo.findOne({
      where: { id },
      relations: ['rooms'],
    });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    return user;
  }

  async findByLogin(login: string) {
    try {
      return this.repo.findOne({
        where: { login },
        select: ['id', 'login', 'password'],
      });
    } catch (error) {
      console.error('Error finding user by login:', error);
      return null;
    }
  }
}
