import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { Domain } from '../../entities/domain.entity';
import { SslCertificate } from '../../entities/ssl-certificate.entity';
import { Log } from '../../entities/log.entity';
import { ProxyRule } from '../../entities/proxy-rule.entity';
import { WebSocketModule } from '../websocket/websocket.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Domain, SslCertificate, Log, ProxyRule]),
    BullModule.registerQueue({
      name: 'job-processor',
    }),
    WebSocketModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}