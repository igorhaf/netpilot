import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST', 'localhost'),
          port: configService.get('REDIS_PORT', 6379),
          password: configService.get('REDIS_PASSWORD'),
          db: configService.get('REDIS_DB', 0),
          maxRetriesPerRequest: 3,
          retryDelayOnFailover: 100,
          enableReadyCheck: true,
          lazyConnect: true,
        },
        defaultJobOptions: {
          removeOnComplete: 50, // Manter apenas os 50 jobs mais recentes
          removeOnFail: 100, // Manter 100 jobs falhados para análise
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
        settings: {
          stalledInterval: 30 * 1000, // 30 segundos
          maxStalledCount: 1,
        },
      }),
      inject: [ConfigService],
    }),
  ],
  exports: [BullModule],
})
export class RedisModule {}