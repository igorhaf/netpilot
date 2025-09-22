import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { User } from '../../../entities/user.entity';

export type JobType = 'backup' | 'restore' | 'pull' | 'prune' | 'exec';
export type JobStatus = 'pending' | 'running' | 'completed' | 'failed';

@Entity('docker_jobs')
@Index(['status', 'type'])
@Index(['user', 'created_at'])
export class DockerJob {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: ['backup', 'restore', 'pull', 'prune', 'exec'] })
  type: JobType;

  @Column({ type: 'enum', enum: ['pending', 'running', 'completed', 'failed'] })
  status: JobStatus;

  @Column({ type: 'varchar', length: 255 })
  resource_type: string;

  @Column({ type: 'varchar', length: 255 })
  resource_id: string;

  @Column({ type: 'jsonb', nullable: true })
  parameters: any;

  @Column({ type: 'int', default: 0 })
  progress: number;

  @Column({ type: 'text', nullable: true })
  message: string;

  @Column({ type: 'jsonb', nullable: true })
  result: any;

  @Column({ type: 'text', nullable: true })
  error: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  completed_at: Date;
}