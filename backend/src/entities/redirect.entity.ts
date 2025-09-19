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

export enum RedirectType {
  PERMANENT = '301',
  TEMPORARY = '302',
}

@Entity('redirects')
export class Redirect {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  sourcePattern: string;

  @Column()
  targetUrl: string;

  @Column({
    type: 'enum',
    enum: RedirectType,
    default: RedirectType.PERMANENT,
  })
  type: RedirectType;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: 1 })
  priority: number;

  @Column({ nullable: true })
  description: string;

  @ManyToOne(() => Domain, (domain) => domain.redirects, {
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