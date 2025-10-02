import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('stacks')
export class Stack {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column()
  technology: string;

  @Column({ default: '#3B82F6' })
  color: string;

  @Column({ default: '1.0.0' })
  version: string;

  @Column({ nullable: true })
  author: string;

  @Column('simple-array', { default: '' })
  tags: string[];

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: 0 })
  totalPresets: number;

  @Column({ default: 0 })
  downloads: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
