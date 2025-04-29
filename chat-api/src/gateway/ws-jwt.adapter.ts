import { IoAdapter } from '@nestjs/platform-socket.io';
import { Server, ServerOptions } from 'socket.io';
import { INestApplicationContext, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

export class WsJwtAdapter extends IoAdapter {
  private readonly jwtService: JwtService;
  private readonly configService: ConfigService;
  private readonly logger = new Logger(WsJwtAdapter.name);
  private readonly allowTestConnections = true; // Configuração para permitir conexões de teste

  constructor(private app: INestApplicationContext) {
    super(app);
    this.jwtService = this.app.get(JwtService);
    this.configService = this.app.get(ConfigService);
    this.logger.log('Adaptador WebSocket JWT inicializado');
  }

  createIOServer(port: number, options?: ServerOptions): Server {
    this.logger.log(`Criando servidor Socket.IO na porta: ${port}`);

    const server: Server = super.createIOServer(port, {
      ...options,
      cors: {
        origin: '*',
        methods: ['GET', 'POST', 'OPTIONS'],
        credentials: true,
        allowedHeaders: ['authorization', 'Authorization', 'Content-Type'],
      },
      transports: ['websocket', 'polling'],
      pingTimeout: 60000, // Aumenta o timeout
      pingInterval: 25000, // Aumenta o intervalo de ping
      connectTimeout: 45000, // Aumenta o timeout de conexão
    });

    server.use(async (socket, next) => {
      try {
        this.logger.log(`Nova conexão recebida: ${socket.id}`);

        // Dump all connection data for debugging
        this.logger.debug('Headers:', socket.handshake.headers);
        this.logger.debug('Auth:', socket.handshake.auth);
        this.logger.debug('Query:', socket.handshake.query);

        // Verificar se é uma conexão de teste
        const isTestMode = socket.handshake.query.test === 'true';

        // Try to extract token from different sources
        let token: string | undefined;

        // 1. Try from Authorization header
        if (socket.handshake.headers.authorization) {
          token = this.extractTokenFromHeader(
            socket.handshake.headers.authorization,
          );
        }

        // 2. If not found, try from auth.token field
        if (!token && socket.handshake.auth && socket.handshake.auth.token) {
          token = this.extractTokenFromHeader(socket.handshake.auth.token);
          this.logger.debug(
            `Token extracted from auth.token: ${token ? 'Yes' : 'No'}`,
          );
        }

        if (!token) {
          this.logger.warn(`Conexão sem token: ${socket.id}`);

          if (this.allowTestConnections || isTestMode) {
            this.logger.warn('Permitindo conexão sem token para testes');
            return next();
          }

          return next(new Error('Token não fornecido'));
        }

        try {
          const secret = this.configService.get('JWT_SECRET') || 'testSecret';
          const payload = await this.jwtService.verifyAsync(token, { secret });

          this.logger.log(`Token válido para usuário: ${payload.sub}`);

          // Store user data in socket.data
          socket.data.user = payload;

          // Ensure user data has been assigned before proceeding
          this.logger.debug(`Socket data after assignment:`, socket.data);

          return next();
        } catch (jwtError) {
          this.logger.error(`Erro ao verificar token: ${jwtError.message}`);

          if (this.allowTestConnections || isTestMode) {
            this.logger.warn(
              'Permitindo conexão com token inválido para testes',
            );
            return next();
          }

          return next(new Error(`Token inválido: ${jwtError.message}`));
        }
      } catch (error) {
        this.logger.error(`Erro geral na autenticação: ${error.message}`);

        if (this.allowTestConnections) {
          this.logger.warn('Permitindo conexão após erro para testes');
          return next();
        }

        return next(new Error(`Erro de autenticação: ${error.message}`));
      }
    });

    return server;
  }

  private extractTokenFromHeader(header: string): string | undefined {
    if (!header) {
      return undefined;
    }

    // Suporta dois formatos comuns: "Bearer TOKEN" ou apenas "TOKEN"
    const parts = header.split(' ');

    if (parts.length >= 2 && parts[0].toLowerCase() === 'bearer') {
      return parts[1];
    } else if (parts.length === 1 && parts[0].length > 10) {
      // Para o caso em que apenas o token é fornecido
      return parts[0];
    }

    return undefined;
  }
}
