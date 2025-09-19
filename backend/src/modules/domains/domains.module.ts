import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DomainsController } from './domains.controller';
import { DomainsService } from './domains.service';
import { Domain } from '../../entities/domain.entity';
import { ConfigGenerationService } from '../../services/config-generation.service';
import { ConfigModule } from '../config/config.module';

@Module({
  imports: [TypeOrmModule.forFeature([Domain]), ConfigModule],
  controllers: [DomainsController],
  providers: [DomainsService, ConfigGenerationService],
  exports: [DomainsService],
})
export class DomainsModule {}