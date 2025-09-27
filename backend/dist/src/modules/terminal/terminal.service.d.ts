import { EventEmitter } from 'events';
export interface CommandOutput {
    id: string;
    type: 'stdout' | 'stderr' | 'exit' | 'error';
    data: string;
    timestamp: Date;
    command?: string;
    exitCode?: number;
}
export declare class TerminalService extends EventEmitter {
    private activeCommands;
    executeCommand(commandId: string, command: string): void;
    killCommand(commandId: string): boolean;
    private parseCommand;
    getActiveCommands(): string[];
}
