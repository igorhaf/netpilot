import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
} from 'typeorm';
import { Stack } from './stack.entity';

@Entity('presets')
export class Preset {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: ['docker', 'persona', 'template', 'script', 'config'],
    default: 'config'
  })
  type: 'docker' | 'persona' | 'template' | 'script' | 'config';

  @Column({ type: 'text' })
  content: string;

  @Column({ nullable: true })
  language: string;

  @Column({ nullable: true })
  filename: string;

  @Column('simple-array', { default: '' })
  tags: string[];

  @Column({ type: 'int', default: 0 })
  size: number;

  @ManyToMany(() => Stack, (stack) => stack.presets)
  stacks: Stack[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
