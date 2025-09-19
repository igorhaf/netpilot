import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SslCertificatesController } from './ssl-certificates.controller';
import { SslCertificatesService } from './ssl-certificates.service';
import { SslCertificate } from '../../entities/ssl-certificate.entity';
import { Domain } from '../../entities/domain.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SslCertificate, Domain])],
  controllers: [SslCertificatesController],
  providers: [SslCertificatesService],
})
export class SslCertificatesModule {}