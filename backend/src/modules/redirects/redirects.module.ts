import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { RedirectsController } from './redirects.controller';
import { RedirectsService } from './redirects.service';
import { Redirect } from '../../entities/redirect.entity';
import { Domain } from '../../entities/domain.entity';
import { ConfigGenerationService } from '../../services/config-generation.service';
import { ConfigModule } from '../config/config.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Redirect, Domain]),
    ConfigModule,
    HttpModule,
    NestConfigModule,
  ],
  controllers: [RedirectsController],
  providers: [RedirectsService, ConfigGenerationService],
})
export class RedirectsModule {}