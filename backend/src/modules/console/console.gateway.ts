import {
    WebSocketGateway,
    SubscribeMessage,
    MessageBody,
    WebSocketServer,
    ConnectedSocket,
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards, Logger } from '@nestjs/common';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { ConsoleService } from './console.service';
import { ExecuteCommandDto } from '../../dtos/ssh-session.dto';

interface AuthenticatedSocket extends Socket {
    userId?: string;
    user?: any;
}

@WebSocketGateway({
    namespace: '/console',
    cors: {
        origin: ['http://meadadigital.com:3000', 'https://meadadigital.com:3000'],
        credentials: true,
    },
})
export class ConsoleGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(ConsoleGateway.name);
    private userSockets: Map<string, Set<string>> = new Map(); // userId -> socketIds

    constructor(private readonly consoleService: ConsoleService) { }

    afterInit(server: Server) {
        this.logger.log('Console WebSocket Gateway initialized');
    }

    async handleConnection(client: AuthenticatedSocket) {
        try {
            // Extrair token JWT do handshake
            const token = client.handshake.auth?.token ||
                client.handshake.headers?.authorization?.replace('Bearer ', '');

            if (!token) {
                this.logger.warn(`Client ${client.id} connected without token`);
                client.disconnect();
                return;
            }

            // Aqui você validaria o token JWT e extrairia o userId
            // Por simplificação, vamos simular a validação
            const userId = await this.validateTokenAndGetUserId(token);

            if (!userId) {
                this.logger.warn(`Client ${client.id} provided invalid token`);
                client.disconnect();
                return;
            }

            client.userId = userId;

            // Adicionar socket ao mapa de usuários
            if (!this.userSockets.has(userId)) {
                this.userSockets.set(userId, new Set());
            }
            this.userSockets.get(userId)!.add(client.id);

            // Juntar às salas das sessões do usuário
            const userSessions = await this.consoleService.findUserSessions(userId);
            for (const session of userSessions) {
                client.join(`session:${session.id}`);
            }

            this.logger.log(`Client ${client.id} connected for user ${userId}`);

            // Enviar estatísticas iniciais
            const stats = await this.consoleService.getUserSessionStats(userId);
            client.emit('session:stats', stats);

        } catch (error) {
            this.logger.error(`Connection error for client ${client.id}:`, error);
            client.disconnect();
        }
    }

    handleDisconnect(client: AuthenticatedSocket) {
        if (client.userId) {
            const userSocketSet = this.userSockets.get(client.userId);
            if (userSocketSet) {
                userSocketSet.delete(client.id);
                if (userSocketSet.size === 0) {
                    this.userSockets.delete(client.userId);
                }
            }
            this.logger.log(`Client ${client.id} disconnected for user ${client.userId}`);
        }
    }

    @SubscribeMessage('session:connect')
    async handleSessionConnect(
        @ConnectedSocket() client: AuthenticatedSocket,
        @MessageBody() data: { sessionId: string }
    ) {
        try {
            if (!client.userId) {
                client.emit('error', { message: 'Não autenticado' });
                return;
            }

            const connected = await this.consoleService.connectToSession(client.userId, data.sessionId);

            if (connected) {
                client.join(`session:${data.sessionId}`);
                client.emit('session:connected', { sessionId: data.sessionId });

                // Notificar outros sockets do usuário
                this.broadcastToUser(client.userId, 'session:status', {
                    sessionId: data.sessionId,
                    status: 'connected'
                });
            }
        } catch (error) {
            client.emit('session:error', {
                sessionId: data.sessionId,
                message: error.message
            });
        }
    }

    @SubscribeMessage('session:disconnect')
    async handleSessionDisconnect(
        @ConnectedSocket() client: AuthenticatedSocket,
        @MessageBody() data: { sessionId: string }
    ) {
        try {
            if (!client.userId) return;

            await this.consoleService.disconnectSession(client.userId, data.sessionId);
            client.leave(`session:${data.sessionId}`);
            client.emit('session:disconnected', { sessionId: data.sessionId });

            // Notificar outros sockets do usuário
            this.broadcastToUser(client.userId, 'session:status', {
                sessionId: data.sessionId,
                status: 'disconnected'
            });
        } catch (error) {
            client.emit('session:error', {
                sessionId: data.sessionId,
                message: error.message
            });
        }
    }

    @SubscribeMessage('command:execute')
    async handleCommandExecute(
        @ConnectedSocket() client: AuthenticatedSocket,
        @MessageBody() data: ExecuteCommandDto & { requestId?: string }
    ) {
        try {
            if (!client.userId) {
                client.emit('error', { message: 'Não autenticado' });
                return;
            }

            // Emitir que comando está sendo executado
            client.emit('command:executing', {
                requestId: data.requestId,
                command: data.command,
                sessionId: data.sessionId
            });

            // Executar comando
            const result = await this.consoleService.executeCommand(client.userId, data);

            // Emitir resultado do comando
            client.emit('command:result', {
                requestId: data.requestId,
                logId: result.id,
                command: result.command,
                output: result.output,
                errorOutput: result.errorOutput,
                exitCode: result.exitCode,
                executionTime: result.executionTime,
                status: result.status,
                executedAt: result.executedAt
            });

            // Broadcast para outros usuários na mesma sessão (se necessário)
            this.server.to(`session:${data.sessionId}`).emit('session:activity', {
                sessionId: data.sessionId,
                userId: client.userId,
                command: data.command,
                timestamp: new Date()
            });

        } catch (error) {
            client.emit('command:error', {
                requestId: data.requestId,
                command: data.command,
                sessionId: data.sessionId,
                message: error.message
            });
        }
    }

    @SubscribeMessage('session:join')
    async handleJoinSession(
        @ConnectedSocket() client: AuthenticatedSocket,
        @MessageBody() data: { sessionId: string }
    ) {
        if (!client.userId) return;

        try {
            // Verificar se usuário tem acesso à sessão
            await this.consoleService.findSessionById(client.userId, data.sessionId);

            client.join(`session:${data.sessionId}`);
            client.emit('session:joined', { sessionId: data.sessionId });

            // Verificar se sessão está conectada
            const isConnected = this.consoleService.isSessionConnected(client.userId, data.sessionId);
            client.emit('session:status', {
                sessionId: data.sessionId,
                status: isConnected ? 'connected' : 'disconnected'
            });

        } catch (error) {
            client.emit('session:error', {
                sessionId: data.sessionId,
                message: 'Sessão não encontrada ou sem acesso'
            });
        }
    }

    @SubscribeMessage('session:leave')
    handleLeaveSession(
        @ConnectedSocket() client: AuthenticatedSocket,
        @MessageBody() data: { sessionId: string }
    ) {
        client.leave(`session:${data.sessionId}`);
        client.emit('session:left', { sessionId: data.sessionId });
    }

    @SubscribeMessage('terminal:resize')
    handleTerminalResize(
        @ConnectedSocket() client: AuthenticatedSocket,
        @MessageBody() data: { sessionId: string, cols: number, rows: number }
    ) {
        // Broadcast resize para outros clientes na mesma sessão
        client.to(`session:${data.sessionId}`).emit('terminal:resize', {
            sessionId: data.sessionId,
            cols: data.cols,
            rows: data.rows
        });
    }

    @SubscribeMessage('ping')
    handlePing(@ConnectedSocket() client: AuthenticatedSocket) {
        client.emit('pong', { timestamp: new Date() });
    }

    // Métodos utilitários
    private async validateTokenAndGetUserId(token: string): Promise<string | null> {
        try {
            // Aqui você implementaria a validação real do JWT
            // Por exemplo, usando o JwtService
            // const payload = this.jwtService.verify(token);
            // return payload.sub;

            // Simulação para desenvolvimento
            if (token === 'valid-token') {
                return 'user-id-123'; // ID do usuário admin
            }

            return null;
        } catch (error) {
            return null;
        }
    }

    private broadcastToUser(userId: string, event: string, data: any) {
        const userSocketSet = this.userSockets.get(userId);
        if (userSocketSet) {
            for (const socketId of userSocketSet) {
                this.server.to(socketId).emit(event, data);
            }
        }
    }

    // Métodos públicos para uso em outros serviços
    emitToSession(sessionId: string, event: string, data: any) {
        this.server.to(`session:${sessionId}`).emit(event, data);
    }

    emitToUser(userId: string, event: string, data: any) {
        this.broadcastToUser(userId, event, data);
    }
}
