import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('ssh_sessions')
export class SshSession {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    sessionName: string;

    @Column()
    hostname: string;

    @Column()
    port: number;

    @Column()
    username: string;

    @Column({ select: false }) // Não incluir por padrão em consultas
    password: string;

    @Column({ nullable: true, select: false })
    privateKey: string;

    @Column({ nullable: true, select: false })
    passphrase: string;

    @Column({ default: 'password' })
    authType: 'password' | 'key';

    @Column({ default: 'active' })
    status: 'active' | 'disconnected' | 'error' | 'connecting';

    @Column({ nullable: true })
    lastError: string;

    @Column({ type: 'timestamp', nullable: true })
    lastConnectedAt: Date;

    @Column({ type: 'timestamp', nullable: true })
    lastDisconnectedAt: Date;

    @Column({ type: 'int', default: 0 })
    commandCount: number;

    @Column({ default: true })
    isActive: boolean;

    @Column({ nullable: true })
    description: string;

    @Column({ type: 'jsonb', nullable: true })
    connectionOptions: Record<string, any>;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column()
    userId: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
