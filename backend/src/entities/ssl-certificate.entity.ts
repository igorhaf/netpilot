import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Domain } from './domain.entity';

export enum CertificateStatus {
  VALID = 'valid',
  EXPIRING = 'expiring',
  EXPIRED = 'expired',
  PENDING = 'pending',
  FAILED = 'failed',
}

@Entity('ssl_certificates')
export class SslCertificate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  primaryDomain: string;

  @Column('simple-array', { nullable: true })
  sanDomains: string[];

  @Column({
    type: 'enum',
    enum: CertificateStatus,
    default: CertificateStatus.PENDING,
  })
  status: CertificateStatus;

  @Column({ nullable: true })
  expiresAt: Date;

  @Column({ default: true })
  autoRenew: boolean;

  @Column({ default: 30 })
  renewBeforeDays: number;

  @Column({ default: false })
  isLocked: boolean;

  @Column({ nullable: true })
  certificatePath: string;

  @Column({ nullable: true })
  privateKeyPath: string;

  @Column({ nullable: true })
  issuer: string;

  @Column({ nullable: true, type: 'text' })
  lastError: string;

  @ManyToOne(() => Domain, (domain) => domain.sslCertificates, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'domainId' })
  domain: Domain;

  @Column()
  domainId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}