import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { User } from '../../../entities/user.entity';

@Entity('docker_events')
@Index(['resource_type', 'created_at'])
@Index(['user_id', 'created_at'])
@Index(['timestamp'])
export class DockerEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  action: string;

  @Column({ type: 'varchar', length: 50 })
  resource_type: string;

  @Column({ type: 'varchar', length: 255 })
  resource_id: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  resource_name: string;

  @Column({ type: 'jsonb', nullable: true })
  details: any;

  @Column({ type: 'varchar', length: 50 })
  result: string;

  @Column({ type: 'text', nullable: true })
  error_message: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'inet', nullable: true })
  ip_address: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  user_agent: string;

  @CreateDateColumn()
  created_at: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  timestamp: Date;
}