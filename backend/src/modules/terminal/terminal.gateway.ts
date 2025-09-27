import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
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
}

export interface KillCommandDto {
  commandId: string;
}

@Injectable()
@WebSocketGateway({
  cors: {
    origin: [
      'http://localhost:3000',
      'https://localhost:3000',
      'http://netpilot.meadadigital.com',
      'https://netpilot.meadadigital.com',
      'http://netpilot.meadadigital.com:3000',
      'https://netpilot.meadadigital.com:3000',
    ],
    credentials: true,
  },
})
export class TerminalGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(TerminalGateway.name);
  private clientCommands = new Map<string, Set<string>>(); // clientId -> Set<commandId>

  constructor(private readonly terminalService: TerminalService) {
    // Escutar saída de comandos e enviar para todos os clientes
    this.terminalService.on('output', (output: CommandOutput) => {
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

    this.logger.log(`Executing command: ${data.command} (ID: ${commandId})`);

    try {
      // Executar comando
      this.terminalService.executeCommand(commandId, data.command);

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