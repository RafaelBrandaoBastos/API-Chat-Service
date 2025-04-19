import { AppModule } from './app.module';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { WsJwtAdapter } from './gateway/ws-jwt.adapter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // Configurar CORS para permitir acesso do frontend
  app.enableCors({
    origin: true, // Aceita qualquer origem
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders:
      'Content-Type,Accept,Authorization,Access-Control-Allow-Origin',
    exposedHeaders: 'Authorization',
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // Usar o adapter JWT para WebSockets com log de debug
  const wsAdapter = new WsJwtAdapter(app);
  console.log('WebSocket Adapter configurado');
  app.useWebSocketAdapter(wsAdapter);

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
  console.log(`Aplicação rodando em: ${await app.getUrl()}`);
}
bootstrap();
