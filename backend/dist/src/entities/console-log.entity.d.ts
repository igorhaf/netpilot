import { SshSession } from './ssh-session.entity';
import { User } from './user.entity';
export declare class ConsoleLog {
    id: string;
    command: string;
    output: string;
    errorOutput: string;
    exitCode: number;
    executionTime: number;
    status: 'completed' | 'running' | 'failed' | 'interrupted';
    workingDirectory: string;
    environment: Record<string, string>;
    metadata: Record<string, any>;
    session: SshSession;
    sessionId: string;
    user: User;
    userId: string;
    executedAt: Date;
}
