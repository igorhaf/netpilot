import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ProxyRule } from './proxy-rule.entity';
import { Redirect } from './redirect.entity';
import { SslCertificate } from './ssl-certificate.entity';

@Entity('domains')
export class Domain {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: true })
  autoTls: boolean;

  @Column({ default: true })
  forceHttps: boolean;

  @Column({ default: false })
  blockExternalAccess: boolean;

  @Column({ default: false })
  enableWwwRedirect: boolean;

  @Column({ nullable: true })
  bindIp: string;

  @OneToMany(() => ProxyRule, (proxyRule) => proxyRule.domain)
  proxyRules: ProxyRule[];

  @OneToMany(() => Redirect, (redirect) => redirect.domain)
  redirects: Redirect[];

  @OneToMany(() => SslCertificate, (certificate) => certificate.domain)
  sslCertificates: SslCertificate[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}