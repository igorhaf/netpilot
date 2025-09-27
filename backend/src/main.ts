import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';
import { AppModule } from './app.module';
import { InitialSeedService } from './seeds/initial-seed';

// Custom WebSocket adapter with enhanced CORS support
class CustomIoAdapter extends IoAdapter {
  createIOServer(port: number, options?: ServerOptions): any {
    const server = super.createIOServer(port, {
      ...options,
      cors: {
        origin: true, // Allow all origins
        methods: ['GET', 'POST'],
        allowedHeaders: ['Authorization', 'Content-Type'],
        credentials: true,
      },
      allowEIO3: true,
      transports: ['websocket', 'polling'],
    });
    return server;
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configure custom WebSocket adapter for external connections
  app.useWebSocketAdapter(new CustomIoAdapter(app));

  app.enableCors({
    origin: true, // Allow all origins for flexibility
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
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
  await app.listen(port, '0.0.0.0'); // Listen on all interfaces for external connections

  console.log(`🚀 NetPilot Backend running on https://netpilot.meadadigital.com/api`);
  console.log(`📚 Swagger docs available at https://netpilot.meadadigital.com/api/docs`);
}

bootstrap();