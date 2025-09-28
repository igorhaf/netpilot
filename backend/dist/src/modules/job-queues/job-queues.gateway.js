"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var JobQueuesGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobQueuesGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const common_1 = require("@nestjs/common");
let JobQueuesGateway = JobQueuesGateway_1 = class JobQueuesGateway {
    constructor() {
        this.logger = new common_1.Logger(JobQueuesGateway_1.name);
        this.connectedClients = new Map();
        this.clientSubscriptions = new Map();
    }
    handleConnection(client) {
        this.logger.log(`Cliente conectado: ${client.id}`);
        this.connectedClients.set(client.id, client);
        this.clientSubscriptions.set(client.id, new Set());
        this.sendInitialStats(client);
    }
    handleDisconnect(client) {
        this.logger.log(`Cliente desconectado: ${client.id}`);
        this.connectedClients.delete(client.id);
        this.clientSubscriptions.delete(client.id);
    }
    handleSubscribeToQueue(client, data) {
        const subscriptions = this.clientSubscriptions.get(client.id);
        if (subscriptions) {
            subscriptions.add(data.queueId);
            client.join(`queue:${data.queueId}`);
            this.logger.log(`Cliente ${client.id} inscrito na fila ${data.queueId}`);
        }
    }
    handleUnsubscribeFromQueue(client, data) {
        const subscriptions = this.clientSubscriptions.get(client.id);
        if (subscriptions) {
            subscriptions.delete(data.queueId);
            client.leave(`queue:${data.queueId}`);
            this.logger.log(`Cliente ${client.id} desinscrito da fila ${data.queueId}`);
        }
    }
    handleSubscribeToAll(client) {
        client.join('global');
        this.logger.log(`Cliente ${client.id} inscrito em todas as notificações`);
    }
    handleUnsubscribeFromAll(client) {
        client.leave('global');
        this.logger.log(`Cliente ${client.id} desinscrito de todas as notificações`);
    }
    sendJobNotification(notification) {
        this.server.to(`queue:${notification.jobQueueId}`).emit('job:notification', notification);
        this.server.to('global').emit('job:notification', notification);
        this.logger.log(`Notificação enviada: ${notification.type} para job ${notification.jobName}`);
    }
    sendQueueNotification(notification) {
        this.server.to(`queue:${notification.queueId}`).emit('queue:notification', notification);
        this.server.to('global').emit('queue:notification', notification);
        this.logger.log(`Notificação de fila enviada: ${notification.type} para ${notification.queueName}`);
    }
    sendSystemNotification(notification) {
        this.server.emit('system:notification', notification);
        this.logger.log(`Notificação de sistema enviada: ${notification.type}`);
    }
    notifyJobStarted(execution, jobQueue) {
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
    notifyJobCompleted(execution, jobQueue) {
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
    notifyJobFailed(execution, jobQueue, error) {
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
    notifyJobRetry(execution, jobQueue) {
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
    notifyJobCancelled(execution, jobQueue) {
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
    notifyQueueCreated(jobQueue) {
        this.sendQueueNotification({
            type: 'queue:created',
            queueId: jobQueue.id,
            queueName: jobQueue.name,
            timestamp: jobQueue.createdAt || new Date(),
        });
    }
    notifyQueueUpdated(jobQueue) {
        this.sendQueueNotification({
            type: 'queue:updated',
            queueId: jobQueue.id,
            queueName: jobQueue.name,
            timestamp: new Date(),
        });
    }
    notifyQueueDeleted(queueId, queueName) {
        this.sendQueueNotification({
            type: 'queue:deleted',
            queueId,
            queueName,
            timestamp: new Date(),
        });
    }
    notifyQueueStatusChanged(jobQueue) {
        this.sendQueueNotification({
            type: jobQueue.isActive ? 'queue:enabled' : 'queue:disabled',
            queueId: jobQueue.id,
            queueName: jobQueue.name,
            timestamp: new Date(),
        });
    }
    async sendInitialStats(client) {
        try {
            const stats = {
                totalQueues: 10,
                activeQueues: 8,
                runningJobs: 3,
                queuedJobs: 12,
                completedToday: 245,
                failedToday: 12,
            };
            client.emit('stats:initial', stats);
        }
        catch (error) {
            this.logger.error('Erro ao enviar estatísticas iniciais:', error);
        }
    }
    broadcastStats(stats) {
        this.server.emit('stats:update', {
            ...stats,
            timestamp: new Date(),
        });
    }
    notifySystemPerformance(metrics) {
        this.sendSystemNotification({
            type: 'system:performance',
            message: 'Métricas de performance atualizadas',
            level: 'info',
            timestamp: new Date(),
            metadata: metrics,
        });
    }
    notifySystemError(error, metadata) {
        this.sendSystemNotification({
            type: 'system:error',
            message: error,
            level: 'error',
            timestamp: new Date(),
            metadata,
        });
    }
    notifySystemMaintenance(message) {
        this.sendSystemNotification({
            type: 'system:maintenance',
            message,
            level: 'warning',
            timestamp: new Date(),
        });
    }
    getConnectionStats() {
        return {
            connectedClients: this.connectedClients.size,
            totalSubscriptions: Array.from(this.clientSubscriptions.values())
                .reduce((total, subscriptions) => total + subscriptions.size, 0),
        };
    }
};
exports.JobQueuesGateway = JobQueuesGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], JobQueuesGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('subscribe:queue'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], JobQueuesGateway.prototype, "handleSubscribeToQueue", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('unsubscribe:queue'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], JobQueuesGateway.prototype, "handleUnsubscribeFromQueue", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('subscribe:all'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], JobQueuesGateway.prototype, "handleSubscribeToAll", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('unsubscribe:all'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], JobQueuesGateway.prototype, "handleUnsubscribeFromAll", null);
exports.JobQueuesGateway = JobQueuesGateway = JobQueuesGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: '*',
        },
        namespace: '/jobs',
    })
], JobQueuesGateway);
//# sourceMappingURL=job-queues.gateway.js.map