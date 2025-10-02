import { EventEmitter } from 'events';
export interface CommandOutput {
    id: string;
    type: 'stdout' | 'stderr' | 'exit' | 'error';
    data: string;
    timestamp: Date;
    command?: string;
    exitCode?: number;
}
export interface ExecuteCommandOptions {
    workingDir?: string;
    user?: string;
}
export declare class TerminalService extends EventEmitter {
    private readonly logger;
    private activeCommands;
    executeCommand(commandId: string, command: string, options?: ExecuteCommandOptions): void;
    killCommand(commandId: string): boolean;
    private parseCommand;
    getActiveCommands(): string[];
}
