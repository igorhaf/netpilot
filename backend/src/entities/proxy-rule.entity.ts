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

@Entity('proxy_rules')
export class ProxyRule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  sourcePath: string;

  @Column({ nullable: true })
  sourcePort: number;

  @Column()
  targetUrl: string;

  @Column({ default: 1 })
  priority: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: true })
  maintainQueryStrings: boolean;

  @Column({ nullable: true })
  description: string;

  @ManyToOne(() => Domain, (domain) => domain.proxyRules, {
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