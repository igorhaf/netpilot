import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ProxyRule } from './proxy-rule.entity';
// import { Redirect } from './redirect.entity'; // Temporarily disabled
import { SslCertificate } from './ssl-certificate.entity';
import { Project } from './project.entity';

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

  @Column({ default: false })
  isLocked: boolean;

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

  @ManyToOne(() => Project, (project) => project.domains, { nullable: false })
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @Column({ nullable: false })
  projectId: string;

  @OneToMany(() => ProxyRule, (proxyRule) => proxyRule.domain)
  proxyRules: ProxyRule[];

  // @OneToMany(() => Redirect, (redirect) => redirect.domain) // Temporarily disabled
  // redirects: Redirect[];

  @OneToMany(() => SslCertificate, (certificate) => certificate.domain)
  sslCertificates: SslCertificate[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}