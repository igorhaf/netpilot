import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InitialSeedService } from './initial-seed';
import { User } from '../entities/user.entity';
import { Domain } from '../entities/domain.entity';
import { ProxyRule } from '../entities/proxy-rule.entity';
import { Redirect } from '../entities/redirect.entity';
import { SslCertificate } from '../entities/ssl-certificate.entity';
import { Log } from '../entities/log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Domain,
      ProxyRule,
      Redirect,
      SslCertificate,
      Log,
    ]),
  ],
  providers: [InitialSeedService],
  exports: [InitialSeedService],
})
export class SeedModule {}