import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JobExecution, ExecutionStatus } from '../../entities/job-execution.entity';
import { JobQueue } from '../../entities/job-queue.entity';

export interface JobNotification {
  type: 'job:started' | 'job:completed' | 'job:failed' | 'job:retry' | 'job:cancelled';
  jobQueueId: string;
  executionId: string;
  jobName: string;
  status: ExecutionStatus;
  timestamp: Date;
  metadata?: any;
  error?: string;
  executionTime?: number;
}

export interface QueueNotification {
  type: 'queue:created' | 'queue:updated' | 'queue:deleted' | 'queue:enabled' | 'queue:disabled';
  queueId: string;
  queueName: string;
  timestamp: Date;
  metadata?: any;
}

export interface SystemNotification {
  type: 'system:performance' | 'system:error' | 'system:maintenance';
  message: string;
  level: 'info' | 'warning' | 'error';
  timestamp: Date;
  metadata?: any;
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/jobs',
})
export class JobQueuesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(JobQueuesGateway.name);
  private connectedClients = new Map<string, Socket>();
  private clientSubscriptions = new Map<string, Set<string>>(); // clientId -> Set<jobQueueIds>

  handleConnection(client: Socket) {
    this.logger.log(`Cliente conectado: ${client.id}`);
    this.connectedClients.set(client.id, client);
    this.clientSubscriptions.set(client.id, new Set());

    // Enviar estatísticas iniciais
    this.sendInitialStats(client);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Cliente desconectado: ${client.id}`);
    this.connectedClients.delete(client.id);
    this.clientSubscriptions.delete(client.id);
  }

  @SubscribeMessage('subscribe:queue')
  handleSubscribeToQueue(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { queueId: string }
  ) {
    const subscriptions = this.clientSubscriptions.get(client.id);
    if (subscriptions) {
      subscriptions.add(data.queueId);
      client.join(`queue:${data.queueId}`);
      this.logger.log(`Cliente ${client.id} inscrito na fila ${data.queueId}`);
    }
  }

  @SubscribeMessage('unsubscribe:queue')
  handleUnsubscribeFromQueue(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { queueId: string }
  ) {
    const subscriptions = this.clientSubscriptions.get(client.id);
    if (subscriptions) {
      subscriptions.delete(data.queueId);
      client.leave(`queue:${data.queueId}`);
      this.logger.log(`Cliente ${client.id} desinscrito da fila ${data.queueId}`);
    }
  }

  @SubscribeMessage('subscribe:all')
  handleSubscribeToAll(@ConnectedSocket() client: Socket) {
    client.join('global');
    this.logger.log(`Cliente ${client.id} inscrito em todas as notificações`);
  }

  @SubscribeMessage('unsubscribe:all')
  handleUnsubscribeFromAll(@ConnectedSocket() client: Socket) {
    client.leave('global');
    this.logger.log(`Cliente ${client.id} desinscrito de todas as notificações`);
  }

  // Métodos para enviar notificações
  sendJobNotification(notification: JobNotification) {
    // Enviar para clientes inscritos na fila específica
    this.server.to(`queue:${notification.jobQueueId}`).emit('job:notification', notification);

    // Enviar para clientes inscritos globalmente
    this.server.to('global').emit('job:notification', notification);

    this.logger.log(`Notificação enviada: ${notification.type} para job ${notification.jobName}`);
  }

  sendQueueNotification(notification: QueueNotification) {
    this.server.to(`queue:${notification.queueId}`).emit('queue:notification', notification);
    this.server.to('global').emit('queue:notification', notification);

    this.logger.log(`Notificação de fila enviada: ${notification.type} para ${notification.queueName}`);
  }

  sendSystemNotification(notification: SystemNotification) {
    this.server.emit('system:notification', notification);
    this.logger.log(`Notificação de sistema enviada: ${notification.type}`);
  }

  // Notificações específicas de jobs
  notifyJobStarted(execution: JobExecution, jobQueue: JobQueue) {
    this.sendJobNotification({
      type: 'job:started',
      jobQueueId: jobQueue.id,
      executionId: execution.id,
      jobName: jobQueue.name,
      status: execution.status,
      timestamp: execution.startedAt || new Date(),
      metadata: execution.metadata,
    });
  }

  notifyJobCompleted(execution: JobExecution, jobQueue: JobQueue) {
    this.sendJobNotification({
      type: 'job:completed',
      jobQueueId: jobQueue.id,
      executionId: execution.id,
      jobName: jobQueue.name,
      status: execution.status,
      timestamp: execution.completedAt || new Date(),
      executionTime: execution.executionTimeMs,
      metadata: execution.metadata,
    });
  }

  notifyJobFailed(execution: JobExecution, jobQueue: JobQueue, error?: string) {
    this.sendJobNotification({
      type: 'job:failed',
      jobQueueId: jobQueue.id,
      executionId: execution.id,
      jobName: jobQueue.name,
      status: execution.status,
      timestamp: execution.completedAt || new Date(),
      error: error || execution.errorLog,
      executionTime: execution.executionTimeMs,
      metadata: execution.metadata,
    });
  }

  notifyJobRetry(execution: JobExecution, jobQueue: JobQueue) {
    this.sendJobNotification({
      type: 'job:retry',
      jobQueueId: jobQueue.id,
      executionId: execution.id,
      jobName: jobQueue.name,
      status: execution.status,
      timestamp: new Date(),
      metadata: {
        ...execution.metadata,
        retryCount: execution.retryCount,
      },
    });
  }

  notifyJobCancelled(execution: JobExecution, jobQueue: JobQueue) {
    this.sendJobNotification({
      type: 'job:cancelled',
      jobQueueId: jobQueue.id,
      executionId: execution.id,
      jobName: jobQueue.name,
      status: execution.status,
      timestamp: execution.completedAt || new Date(),
      metadata: execution.metadata,
    });
  }

  // Notificações de fila
  notifyQueueCreated(jobQueue: JobQueue) {
    this.sendQueueNotification({
      type: 'queue:created',
      queueId: jobQueue.id,
      queueName: jobQueue.name,
      timestamp: jobQueue.createdAt || new Date(),
    });
  }

  notifyQueueUpdated(jobQueue: JobQueue) {
    this.sendQueueNotification({
      type: 'queue:updated',
      queueId: jobQueue.id,
      queueName: jobQueue.name,
      timestamp: new Date(),
    });
  }

  notifyQueueDeleted(queueId: string, queueName: string) {
    this.sendQueueNotification({
      type: 'queue:deleted',
      queueId,
      queueName,
      timestamp: new Date(),
    });
  }

  notifyQueueStatusChanged(jobQueue: JobQueue) {
    this.sendQueueNotification({
      type: jobQueue.isActive ? 'queue:enabled' : 'queue:disabled',
      queueId: jobQueue.id,
      queueName: jobQueue.name,
      timestamp: new Date(),
    });
  }

  // Estatísticas em tempo real
  private async sendInitialStats(client: Socket) {
    try {
      // Aqui você pode buscar estatísticas iniciais do banco
      const stats = {
        totalQueues: 10,
        activeQueues: 8,
        runningJobs: 3,
        queuedJobs: 12,
        completedToday: 245,
        failedToday: 12,
      };

      client.emit('stats:initial', stats);
    } catch (error) {
      this.logger.error('Erro ao enviar estatísticas iniciais:', error);
    }
  }

  // Broadcast de estatísticas periódicas
  broadcastStats(stats: any) {
    this.server.emit('stats:update', {
      ...stats,
      timestamp: new Date(),
    });
  }

  // Notificações de sistema
  notifySystemPerformance(metrics: any) {
    this.sendSystemNotification({
      type: 'system:performance',
      message: 'Métricas de performance atualizadas',
      level: 'info',
      timestamp: new Date(),
      metadata: metrics,
    });
  }

  notifySystemError(error: string, metadata?: any) {
    this.sendSystemNotification({
      type: 'system:error',
      message: error,
      level: 'error',
      timestamp: new Date(),
      metadata,
    });
  }

  notifySystemMaintenance(message: string) {
    this.sendSystemNotification({
      type: 'system:maintenance',
      message,
      level: 'warning',
      timestamp: new Date(),
    });
  }

  // Estatísticas de conexão
  getConnectionStats() {
    return {
      connectedClients: this.connectedClients.size,
      totalSubscriptions: Array.from(this.clientSubscriptions.values())
        .reduce((total, subscriptions) => total + subscriptions.size, 0),
    };
  }
}