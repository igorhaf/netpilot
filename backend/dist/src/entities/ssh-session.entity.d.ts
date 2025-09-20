import { User } from './user.entity';
export declare class SshSession {
    id: string;
    sessionName: string;
    hostname: string;
    port: number;
    username: string;
    password: string;
    privateKey: string;
    passphrase: string;
    authType: 'password' | 'key';
    status: 'active' | 'disconnected' | 'error' | 'connecting';
    lastError: string;
    lastConnectedAt: Date;
    lastDisconnectedAt: Date;
    commandCount: number;
    isActive: boolean;
    description: string;
    connectionOptions: Record<string, any>;
    user: User;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
}
