import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { CacheModule } from '@nestjs/cache-manager';
import { AuthModule } from './modules/auth/auth.module';
import { DomainsModule } from './modules/domains/domains.module';
import { ProxyRulesModule } from './modules/proxy-rules/proxy-rules.module';
// import { RedirectsModule } from './modules/redirects/redirects.module'; // Temporarily disabled
import { SslCertificatesModule } from './modules/ssl-certificates/ssl-certificates.module';
import { LogsModule } from './modules/logs/logs.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { ConsoleModule } from './modules/console/console.module';
// Docker module imports removed due to initialization issues
import { WebSocketModule } from './modules/websocket/websocket.module';
import { SeedModule } from './seeds/seed.module';
import { ConfigModule } from './modules/config/config.module';
import { User } from './entities/user.entity';
import { Domain } from './entities/domain.entity';
import { ProxyRule } from './entities/proxy-rule.entity';
// import { Redirect } from './entities/redirect.entity'; // Temporarily disabled
import { SslCertificate } from './entities/ssl-certificate.entity';
import { Log } from './entities/log.entity';
import { SshSession } from './entities/ssh-session.entity';
import { ConsoleLog } from './entities/console-log.entity';
// Docker entities removed temporarily due to module issues

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
        entities: [User, Domain, ProxyRule, SslCertificate, Log, SshSession, ConsoleLog],
        synchronize: false, // Temporarily disabled to avoid migration issues
        logging: process.env.NODE_ENV === 'development',
      }),
      inject: [ConfigService],
    }),
    BullModule.forRootAsync({
      imports: [NestConfigModule],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST', 'localhost'),
          port: configService.get('REDIS_PORT', 6379),
          password: configService.get('REDIS_PASSWORD'),
        },
      }),
      inject: [ConfigService],
    }),
    CacheModule.registerAsync({
      imports: [NestConfigModule],
      useFactory: (configService: ConfigService) => ({
        ttl: 300000, // 5 minutes
        max: 100,
      }),
      inject: [ConfigService],
      isGlobal: true,
    }),
    ConfigModule,
    AuthModule,
    DomainsModule,
    ProxyRulesModule,
    // RedirectsModule, // Temporarily disabled
    SslCertificatesModule,
    LogsModule,
    DashboardModule,
    ConsoleModule,
    // DockerModule temporarily disabled due to initialization issues
    WebSocketModule,
    SeedModule,
  ],
  // No custom controllers in AppModule
})
export class AppModule { }