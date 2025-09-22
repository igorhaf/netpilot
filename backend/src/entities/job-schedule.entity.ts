import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { JobQueue } from './job-queue.entity';

export enum ScheduleType {
  CRON = 'cron',
  INTERVAL = 'interval',
  SPECIFIC_DATES = 'specific_dates',
  ONCE = 'once',
}

@Entity('job_schedules')
export class JobSchedule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => JobQueue, (jobQueue) => jobQueue.schedules, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'job_queue_id' })
  jobQueue: JobQueue;

  @Column({
    type: 'enum',
    enum: ScheduleType,
    default: ScheduleType.CRON,
  })
  scheduleType: ScheduleType;

  @Column({ nullable: true })
  cronExpression: string;

  @Column({ nullable: true })
  intervalMinutes: number;

  @Column('json', { nullable: true })
  specificDates: Date[];

  @Column({ nullable: true })
  startDate: Date;

  @Column({ nullable: true })
  endDate: Date;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  nextExecution: Date;

  @Column({ nullable: true })
  lastExecution: Date;

  @Column('json', { nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}