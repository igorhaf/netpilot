import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export enum LogType {
  DEPLOYMENT = 'deployment',
  SSL_RENEWAL = 'ssl_renewal',
  NGINX_RELOAD = 'nginx_reload',
  TRAEFIK_RELOAD = 'traefik_reload',
  SYSTEM = 'system',
}

export enum LogStatus {
  SUCCESS = 'success',
  FAILED = 'failed',
  RUNNING = 'running',
  PENDING = 'pending',
}

@Entity('logs')
export class Log {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: LogType,
  })
  type: LogType;

  @Column({
    type: 'enum',
    enum: LogStatus,
    default: LogStatus.PENDING,
  })
  status: LogStatus;

  @Column()
  action: string;

  @Column({ nullable: true, type: 'text' })
  message: string;

  @Column({ nullable: true, type: 'text' })
  details: string;

  @Column({ nullable: true })
  duration: number;

  @Column({ nullable: true })
  startedAt: Date;

  @Column({ nullable: true })
  completedAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}