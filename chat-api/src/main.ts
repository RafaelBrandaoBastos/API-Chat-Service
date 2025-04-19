import { AppModule } from './app.module';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { WsJwtAdapter } from './gateway/ws-jwt.adapter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configurar CORS para permitir acesso do frontend
  app.enableCors({
    origin: ['http://localhost:3001', 'http://localhost:3000', '*'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    credentials: true,
    allowedHeaders: 'Content-Type, Accept, Authorization',
  });

  app.useGlobalPipes(new ValidationPipe());

  // Usar o adapter JWT para WebSockets
  app.useWebSocketAdapter(new WsJwtAdapter(app));

  const config = new DocumentBuilder()
    .setTitle('API de Chat')
    .setDescription('API RESTful para um sistema de chat em tempo real')
    .setVersion('1.0')
    .addTag('auth', 'Operações de autenticação')
    .addTag('users', 'Operações de gerenciamento de usuários')
    .addTag('rooms', 'Operações de salas de chat')
    .addTag('messages', 'Operações de mensagens')
    .addTag('room-messages', 'Operações de mensagens em salas')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  await app.listen(3000);
}
bootstrap();
