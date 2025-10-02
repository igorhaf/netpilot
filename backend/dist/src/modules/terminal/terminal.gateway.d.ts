import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { TerminalService } from './terminal.service';
export interface ExecuteCommandDto {
    command: string;
    projectId?: string;
    projectAlias?: string;
    workingDir?: string;
}
export interface KillCommandDto {
    commandId: string;
}
export declare class TerminalGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    private readonly terminalService;
    server: Server;
    private readonly logger;
    private clientCommands;
    constructor(terminalService: TerminalService);
    afterInit(server: Server): void;
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    handleExecuteCommand(data: ExecuteCommandDto, client: Socket): Promise<void>;
    handleKillCommand(data: KillCommandDto, client: Socket): Promise<void>;
    handleGetActiveCommands(client: Socket): Promise<void>;
}
