import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../../entities/user.entity';

@Entity('docker_quotas')
export class DockerQuota {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'int', default: 10 })
  max_containers: number;

  @Column({ type: 'int', default: 5 })
  max_volumes: number;

  @Column({ type: 'int', default: 3 })
  max_networks: number;

  @Column({ type: 'bigint', default: 5368709120 }) // 5GB
  max_volume_size: number;

  @Column({ type: 'int', default: 10 })
  max_actions_per_minute: number;

  @Column({ type: 'int', default: 1800 }) // 30min
  max_exec_timeout: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}