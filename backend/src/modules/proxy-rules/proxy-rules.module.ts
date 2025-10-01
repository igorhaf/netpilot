import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { ProxyRulesController } from './proxy-rules.controller';
import { ProxyRulesService } from './proxy-rules.service';
import { ProxyRule } from '../../entities/proxy-rule.entity';
import { Domain } from '../../entities/domain.entity';
import { ConfigGenerationService } from '../../services/config-generation.service';
import { ConfigModule } from '../config/config.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProxyRule, Domain]),
    ConfigModule,
    HttpModule,
    NestConfigModule,
  ],
  controllers: [ProxyRulesController],
  providers: [ProxyRulesService, ConfigGenerationService],
})
export class ProxyRulesModule {}