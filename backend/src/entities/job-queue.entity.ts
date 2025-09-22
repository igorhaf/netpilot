import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { JobExecution } from './job-execution.entity';
import { JobSchedule } from './job-schedule.entity';

export enum ScriptType {
  SHELL = 'shell',
  NODE = 'node',
  PYTHON = 'python',
  INTERNAL = 'internal',
}

@Entity('job_queues')
export class JobQueue {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column('text', { nullable: true })
  description: string;

  @Column()
  scriptPath: string;

  @Column({
    type: 'enum',
    enum: ScriptType,
    default: ScriptType.INTERNAL,
  })
  scriptType: ScriptType;

  @Column({ nullable: true })
  cronExpression: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: 5 })
  priority: number;

  @Column({ default: 3 })
  maxRetries: number;

  @Column({ default: 300 })
  timeoutSeconds: number;

  @Column('json', { nullable: true })
  environmentVars: Record<string, string>;

  @Column('json', { nullable: true })
  metadata: Record<string, any>;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  createdBy: User;

  @OneToMany(() => JobExecution, (execution) => execution.jobQueue)
  executions: JobExecution[];

  @OneToMany(() => JobSchedule, (schedule) => schedule.jobQueue)
  schedules: JobSchedule[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}