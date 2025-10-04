import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger, UseGuards } from '@nestjs/common';
import { TerminalService, CommandOutput } from './terminal.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';

// Simple UUID generator function
function generateUUID(): string {
  return 'cmd-' + Date.now() + '-' + Math.random().toString(36).substring(2, 15);
}

export interface ExecuteCommandDto {
  command: string;
  projectId?: string;
  projectAlias?: string;
  workingDir?: string;
}

export interface KillCommandDto {
  commandId: string;
}

@Injectable()
@WebSocketGateway({
  namespace: '/terminal',
  cors: {
    origin: true, // Allow all origins for external server connections
    methods: ['GET', 'POST'],
    allowedHeaders: ['Authorization', 'Content-Type'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true,
})
export class TerminalGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(TerminalGateway.name);
  private clientCommands = new Map<string, Set<string>>(); // clientId -> Set<commandId>

  constructor(private readonly terminalService: TerminalService) {}

  afterInit(server: Server) {
    this.logger.log('[Terminal] Gateway initialized');

    // Escutar saída de comandos e enviar para todos os clientes do namespace /terminal
    this.terminalService.on('output', (output: CommandOutput) => {
      this.logger.log(`[Terminal] Broadcasting: ${output.type} - ${output.data.substring(0, 50)}`);
      // Emitir para todos os sockets do namespace
      this.server.emit('commandOutput', output);
    });
  }

  handleConnection(client: Socket) {
    this.logger.log(`[Terminal] Client connected: ${client.id}`);
    console.log(`[Terminal Debug] Client connected: ${client.id}`);
    this.clientCommands.set(client.id, new Set());
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);

    // Matar comandos ativos do cliente que desconectou
    const commandIds = this.clientCommands.get(client.id);
    if (commandIds) {
      commandIds.forEach(commandId => {
        this.terminalService.killCommand(commandId);
      });
    }

    this.clientCommands.delete(client.id);
  }

  @SubscribeMessage('executeCommand')
  // @UseGuards(JwtAuthGuard) // Temporarily disabled for testing
  async handleExecuteCommand(
    @MessageBody() data: ExecuteCommandDto,
    @ConnectedSocket() client: Socket,
  ) {
    const commandId = generateUUID();

    // Registrar comando para este cliente
    const clientCommandIds = this.clientCommands.get(client.id) || new Set();
    clientCommandIds.add(commandId);
    this.clientCommands.set(client.id, clientCommandIds);

    this.logger.log(`Executing command: ${data.command} (ID: ${commandId})${data.projectAlias ? ` for project: ${data.projectAlias}` : ''}`);

    try {
      // Executar comando com opções do projeto
      const options = data.projectAlias ? {
        user: data.projectAlias,
        workingDir: data.workingDir || `/home/${data.projectAlias}`
      } : undefined;

      this.terminalService.executeCommand(commandId, data.command, options);

      // Confirmar execução iniciada
      client.emit('commandStarted', {
        commandId,
        command: data.command,
        timestamp: new Date(),
      });

    } catch (error) {
      this.logger.error(`Failed to execute command: ${error.message}`);
      client.emit('commandError', {
        commandId,
        error: error.message,
        timestamp: new Date(),
      });
    }
  }

  @SubscribeMessage('killCommand')
  // @UseGuards(JwtAuthGuard) // Temporarily disabled for testing
  async handleKillCommand(
    @MessageBody() data: KillCommandDto,
    @ConnectedSocket() client: Socket,
  ) {
    const success = this.terminalService.killCommand(data.commandId);

    if (success) {
      // Remover da lista de comandos do cliente
      const clientCommandIds = this.clientCommands.get(client.id);
      if (clientCommandIds) {
        clientCommandIds.delete(data.commandId);
      }

      client.emit('commandKilled', {
        commandId: data.commandId,
        timestamp: new Date(),
      });

      this.logger.log(`Command killed: ${data.commandId}`);
    } else {
      client.emit('commandError', {
        commandId: data.commandId,
        error: 'Command not found or already finished',
        timestamp: new Date(),
      });
    }
  }

  @SubscribeMessage('getActiveCommands')
  // @UseGuards(JwtAuthGuard) // Temporarily disabled for testing
  async handleGetActiveCommands(@ConnectedSocket() client: Socket) {
    const activeCommands = this.terminalService.getActiveCommands();
    client.emit('activeCommands', {
      commands: activeCommands,
      timestamp: new Date(),
    });
  }
}