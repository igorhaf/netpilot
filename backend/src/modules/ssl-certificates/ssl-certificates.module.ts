import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { SslCertificatesController } from './ssl-certificates.controller';
import { SslCertificatesService } from './ssl-certificates.service';
import { SslCertificate } from '../../entities/ssl-certificate.entity';
import { Domain } from '../../entities/domain.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([SslCertificate, Domain]),
    HttpModule,
    ConfigModule,
  ],
  controllers: [SslCertificatesController],
  providers: [SslCertificatesService],
})
export class SslCertificatesModule {}