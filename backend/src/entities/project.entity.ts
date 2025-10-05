import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToMany,
  ManyToOne,
  JoinTable,
  JoinColumn,
} from 'typeorm';
import { Domain } from './domain.entity';
import { Stack } from './stack.entity';
import { Preset } from './preset.entity';
import { JobQueue } from './job-queue.entity';

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ unique: true })
  alias: string; // Apelido/pasta raiz - deve ser lowercase, hifens, sem caracteres especiais

  @Column({ nullable: true })
  projectPath: string; // Caminho absoluto da pasta do projeto

  @Column({ nullable: true })
  description: string;

  @Column({ default: true })
  isActive: boolean;

  @Column('simple-array', { nullable: true })
  technologies: string[];

  @Column({ nullable: true })
  repository: string;

  @Column({ default: false })
  cloned: boolean; // Se o repositório já foi clonado

  @Column({ default: false })
  hasSshKey: boolean; // Se possui chaves SSH configuradas

  @Column({ type: 'text', nullable: true })
  sshPublicKey: string; // Chave pública SSH (armazenada também em /home/{alias}/.ssh/id_rsa.pub)

  @Column({ nullable: true })
  sshKeyFingerprint: string; // Fingerprint da chave SSH para identificação

  @Column({ nullable: true })
  documentation: string;

  @Column({ type: 'text', nullable: true })
  aiSessionData: string; // JSON string para armazenar dados de sessão de IA

  @Column({ nullable: true })
  mainDomain: string; // Domínio principal do projeto

  @Column('simple-json', { nullable: true })
  metadata: Record<string, any>; // Metadados flexíveis

  @Column({ type: 'text', nullable: true })
  defaultPromptTemplate: string; // Template padrão de prompt para IA

  @Column({
    type: 'enum',
    enum: ['realtime', 'queue'],
    default: 'queue'
  })
  executionMode: 'realtime' | 'queue'; // Modo de execução de prompts IA

  @Column({ nullable: true })
  jobQueueId: string; // ID do job associado para executar comandos

  @ManyToOne(() => JobQueue, { nullable: true })
  @JoinColumn({ name: 'jobQueueId' })
  jobQueue: JobQueue;

  @ManyToMany(() => Stack, { eager: true })
  @JoinTable({
    name: 'project_stacks',
    joinColumn: { name: 'project_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'stack_id', referencedColumnName: 'id' }
  })
  stacks: Stack[];

  @ManyToMany(() => Preset, { eager: true })
  @JoinTable({
    name: 'project_presets',
    joinColumn: { name: 'project_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'preset_id', referencedColumnName: 'id' }
  })
  presets: Preset[];

  @OneToMany(() => Domain, (domain) => domain.project)
  domains: Domain[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}