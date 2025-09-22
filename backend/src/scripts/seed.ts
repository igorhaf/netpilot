import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { InitialSeedService } from '../seeds/initial-seed';

async function bootstrap() {
  console.log('🌱 Iniciando execução dos seeds...');

  try {
    const app = await NestFactory.createApplicationContext(AppModule, {
      logger: false,
    });

    const seedService = app.get(InitialSeedService);
    await seedService.seed();

    await app.close();
    console.log('✅ Seeds executados com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao executar seeds:', error.message);
    process.exit(1);
  }
}

bootstrap();