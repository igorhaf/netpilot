import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Domain } from './domain.entity';

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

  @OneToMany(() => Domain, (domain) => domain.project)
  domains: Domain[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}