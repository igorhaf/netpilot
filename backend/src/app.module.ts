import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './modules/auth/auth.module';
import { DomainsModule } from './modules/domains/domains.module';
import { ProxyRulesModule } from './modules/proxy-rules/proxy-rules.module';
import { RedirectsModule } from './modules/redirects/redirects.module';
import { SslCertificatesModule } from './modules/ssl-certificates/ssl-certificates.module';
import { LogsModule } from './modules/logs/logs.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { SeedModule } from './seeds/seed.module';
import { ConfigModule } from './modules/config/config.module';
import { User } from './entities/user.entity';
import { Domain } from './entities/domain.entity';
import { ProxyRule } from './entities/proxy-rule.entity';
import { Redirect } from './entities/redirect.entity';
import { SslCertificate } from './entities/ssl-certificate.entity';
import { Log } from './entities/log.entity';

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [NestConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get('DATABASE_URL'),
        entities: [User, Domain, ProxyRule, Redirect, SslCertificate, Log],
        synchronize: process.env.NODE_ENV === 'development',
        logging: process.env.NODE_ENV === 'development',
      }),
      inject: [ConfigService],
    }),
    ConfigModule,
    AuthModule,
    DomainsModule,
    ProxyRulesModule,
    RedirectsModule,
    SslCertificatesModule,
    LogsModule,
    DashboardModule,
    SeedModule,
  ],
})
export class AppModule { }