import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { AppModule } from './app.module';
import { InitialSeedService } from './seeds/initial-seed';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configure WebSocket adapter
  app.useWebSocketAdapter(new IoAdapter(app));

  app.enableCors({
    origin: [
      'https://netpilot.meadadigital.com',
      'https://netpilot.meadadigital.com:3000',
      'http://netpilot.meadadigital.com',
      'http://netpilot.meadadigital.com:3000'
    ],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.setGlobalPrefix('api');

  const config = new DocumentBuilder()
    .setTitle('NetPilot API')
    .setDescription('Sistema de Proxy Reverso e Gestão SSL')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Run seeds in development
  if (process.env.NODE_ENV === 'development') {
    const seedService = app.get(InitialSeedService);
    await seedService.seed();
  }

  const port = process.env.PORT || 3001;
  await app.listen(port);

  console.log(`🚀 NetPilot Backend running on https://netpilot.meadadigital.com/api`);
  console.log(`📚 Swagger docs available at https://netpilot.meadadigital.com/api/docs`);
}

bootstrap();