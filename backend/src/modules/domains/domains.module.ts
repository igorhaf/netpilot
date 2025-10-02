import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { DomainsController } from './domains.controller';
import { DomainsService } from './domains.service';
import { Domain } from '../../entities/domain.entity';
import { ConfigGenerationService } from '../../services/config-generation.service';
import { ConfigModule } from '../config/config.module';
import { LogsModule } from '../logs/logs.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Domain]),
    ConfigModule,
    HttpModule,
    NestConfigModule,
    LogsModule,
  ],
  controllers: [DomainsController],
  providers: [DomainsService, ConfigGenerationService],
  exports: [DomainsService],
})
export class DomainsModule {}