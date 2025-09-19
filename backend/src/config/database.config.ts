import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { Domain } from '../entities/domain.entity';
import { ProxyRule } from '../entities/proxy-rule.entity';
import { Redirect } from '../entities/redirect.entity';
import { SslCertificate } from '../entities/ssl-certificate.entity';
import { Log } from '../entities/log.entity';

export const databaseConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [User, Domain, ProxyRule, Redirect, SslCertificate, Log],
  migrations: ['dist/migrations/*.js'],
  migrationsRun: true,
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
};