import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { SshSession } from './ssh-session.entity';
import { User } from './user.entity';

@Entity('console_logs')
export class ConsoleLog {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    command: string;

    @Column({ type: 'text', nullable: true })
    output: string;

    @Column({ type: 'text', nullable: true })
    errorOutput: string;

    @Column({ default: 0 })
    exitCode: number;

    @Column({ type: 'int' })
    executionTime: number; // em milissegundos

    @Column({ default: 'completed' })
    status: 'completed' | 'running' | 'failed' | 'interrupted';

    @Column()
    workingDirectory: string;

    @Column({ type: 'jsonb', nullable: true })
    environment: Record<string, string>;

    @Column({ type: 'jsonb', nullable: true })
    metadata: Record<string, any>;

    @ManyToOne(() => SshSession, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'sessionId' })
    session: SshSession;

    @Column()
    sessionId: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column()
    userId: string;

    @CreateDateColumn()
    executedAt: Date;
}
