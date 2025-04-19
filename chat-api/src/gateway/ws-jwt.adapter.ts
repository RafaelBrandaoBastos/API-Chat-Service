import { IoAdapter } from '@nestjs/platform-socket.io';
import { Server, ServerOptions } from 'socket.io';
import { INestApplicationContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

export class WsJwtAdapter extends IoAdapter {
  private readonly jwtService: JwtService;
  private readonly configService: ConfigService;

  constructor(private app: INestApplicationContext) {
    super(app);
    this.jwtService = this.app.get(JwtService);
    this.configService = this.app.get(ConfigService);
  }

  createIOServer(port: number, options?: ServerOptions): Server {
    const server: Server = super.createIOServer(port, {
      ...options,
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });

    server.use(async (socket, next) => {
      try {
        const token = this.extractTokenFromHeader(
          socket.handshake.headers.authorization || '',
        );

        if (!token) {
          return next(new Error('Token não fornecido'));
        }

        const secret = this.configService.get('JWT_SECRET') || 'testSecret';
        const payload = await this.jwtService.verifyAsync(token, { secret });

        // Armazenar o payload do usuário no socket
        socket.data.user = payload;
        next();
      } catch (error) {
        next(new Error('Token inválido'));
      }
    });

    return server;
  }

  private extractTokenFromHeader(header: string): string | undefined {
    if (!header) {
      return undefined;
    }
    const [type, token] = header.split(' ') || [];
    return type === 'Bearer' ? token : undefined;
  }
}
