import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
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
export declare class JobQueuesGateway implements OnGatewayConnection, OnGatewayDisconnect {
    server: Server;
    private readonly logger;
    private connectedClients;
    private clientSubscriptions;
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    handleSubscribeToQueue(client: Socket, data: {
        queueId: string;
    }): void;
    handleUnsubscribeFromQueue(client: Socket, data: {
        queueId: string;
    }): void;
    handleSubscribeToAll(client: Socket): void;
    handleUnsubscribeFromAll(client: Socket): void;
    sendJobNotification(notification: JobNotification): void;
    sendQueueNotification(notification: QueueNotification): void;
    sendSystemNotification(notification: SystemNotification): void;
    notifyJobStarted(execution: JobExecution, jobQueue: JobQueue): void;
    notifyJobCompleted(execution: JobExecution, jobQueue: JobQueue): void;
    notifyJobFailed(execution: JobExecution, jobQueue: JobQueue, error?: string): void;
    notifyJobRetry(execution: JobExecution, jobQueue: JobQueue): void;
    notifyJobCancelled(execution: JobExecution, jobQueue: JobQueue): void;
    notifyQueueCreated(jobQueue: JobQueue): void;
    notifyQueueUpdated(jobQueue: JobQueue): void;
    notifyQueueDeleted(queueId: string, queueName: string): void;
    notifyQueueStatusChanged(jobQueue: JobQueue): void;
    private sendInitialStats;
    broadcastStats(stats: any): void;
    notifySystemPerformance(metrics: any): void;
    notifySystemError(error: string, metadata?: any): void;
    notifySystemMaintenance(message: string): void;
    getConnectionStats(): {
        connectedClients: number;
        totalSubscriptions: number;
    };
}
