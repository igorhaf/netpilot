import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { Domain } from '../../entities/domain.entity';
import { SslCertificate } from '../../entities/ssl-certificate.entity';
import { Log } from '../../entities/log.entity';
import { ProxyRule } from '../../entities/proxy-rule.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Domain, SslCertificate, Log, ProxyRule])],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}