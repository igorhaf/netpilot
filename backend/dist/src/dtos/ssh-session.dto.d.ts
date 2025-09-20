export declare class CreateSshSessionDto {
    sessionName: string;
    hostname: string;
    port: number;
    username: string;
    authType: 'password' | 'key';
    password?: string;
    privateKey?: string;
    passphrase?: string;
    description?: string;
    connectionOptions?: Record<string, any>;
    isActive?: boolean;
}
declare const UpdateSshSessionDto_base: import("@nestjs/common").Type<Partial<CreateSshSessionDto>>;
export declare class UpdateSshSessionDto extends UpdateSshSessionDto_base {
}
export declare class ConnectSshSessionDto {
    sessionId: string;
}
export declare class ExecuteCommandDto {
    command: string;
    sessionId: string;
    workingDirectory?: string;
    environment?: Record<string, string>;
    timeout?: number;
}
export declare class SshSessionResponseDto {
    id: string;
    sessionName: string;
    hostname: string;
    port: number;
    username: string;
    authType: string;
    status: string;
    lastConnectedAt: Date;
    commandCount: number;
    createdAt: Date;
}
export declare class CommandExecutionResponseDto {
    id: string;
    command: string;
    output: string;
    errorOutput: string;
    exitCode: number;
    executionTime: number;
    status: string;
    executedAt: Date;
}
export {};
