import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { JobQueue } from './job-queue.entity';
import { User } from './user.entity';

export enum ExecutionStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  TIMEOUT = 'timeout',
}

export enum TriggerType {
  SCHEDULED = 'scheduled',
  MANUAL = 'manual',
  API = 'api',
}

@Entity('job_executions')
export class JobExecution {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => JobQueue, (jobQueue) => jobQueue.executions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'job_queue_id' })
  jobQueue: JobQueue;

  @Column({
    type: 'enum',
    enum: ExecutionStatus,
    default: ExecutionStatus.PENDING,
  })
  status: ExecutionStatus;

  @Column({ nullable: true })
  startedAt: Date;

  @Column({ nullable: true })
  completedAt: Date;

  @Column({ nullable: true })
  executionTimeMs: number;

  @Column('text', { nullable: true })
  outputLog: string;

  @Column('text', { nullable: true })
  errorLog: string;

  @Column({ default: 0 })
  retryCount: number;

  @Column({
    type: 'enum',
    enum: TriggerType,
    default: TriggerType.SCHEDULED,
  })
  triggerType: TriggerType;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'triggered_by' })
  triggeredBy: User;

  @Column('json', { nullable: true })
  metadata: Record<string, any>;

  @Column({ nullable: true })
  pid: number;

  @CreateDateColumn()
  createdAt: Date;
}