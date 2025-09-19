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
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const log_entity_1 = require("../../entities/log.entity");
let LogsService = class LogsService {
    constructor(logRepository) {
        this.logRepository = logRepository;
    }
    async findAll(type, status) {
        const query = this.logRepository.createQueryBuilder('log');
        if (type) {
            query.where('log.type = :type', { type });
        }
        if (status) {
            query.andWhere('log.status = :status', { status });
        }
        return query.orderBy('log.createdAt', 'DESC').getMany();
    }
    async getStats() {
        const [total, success, failed, running] = await Promise.all([
            this.logRepository.count(),
            this.logRepository.count({ where: { status: log_entity_1.LogStatus.SUCCESS } }),
            this.logRepository.count({ where: { status: log_entity_1.LogStatus.FAILED } }),
            this.logRepository.count({ where: { status: log_entity_1.LogStatus.RUNNING } }),
        ]);
        return {
            total,
            success,
            failed,
            running,
        };
    }
    async createLog(type, action, message, details) {
        const log = this.logRepository.create({
            type,
            action,
            message,
            details,
            status: log_entity_1.LogStatus.PENDING,
            startedAt: new Date(),
        });
        return await this.logRepository.save(log);
    }
    async updateLogStatus(id, status, message, details) {
        const log = await this.logRepository.findOne({ where: { id } });
        if (log) {
            log.status = status;
            if (message)
                log.message = message;
            if (details)
                log.details = details;
            if (status === log_entity_1.LogStatus.SUCCESS || status === log_entity_1.LogStatus.FAILED) {
                log.completedAt = new Date();
                if (log.startedAt) {
                    log.duration = log.completedAt.getTime() - log.startedAt.getTime();
                }
            }
            await this.logRepository.save(log);
        }
    }
    async clearLogs() {
        try {
            await this.logRepository.clear();
            return {
                success: true,
                message: 'Logs limpos com sucesso',
            };
        }
        catch (error) {
            return {
                success: false,
                message: `Erro ao limpar logs: ${error.message}`,
            };
        }
    }
    async getRecentLogs(limit = 10) {
        return this.logRepository.find({
            order: { createdAt: 'DESC' },
            take: limit,
        });
    }
    async exportLogs(type, status) {
        const logs = await this.findAll(type, status);
        const header = [
            'ID',
            'Tipo',
            'Status',
            'Ação',
            'Mensagem',
            'Detalhes',
            'Duração (ms)',
            'Iniciado em',
            'Concluído em',
            'Criado em',
        ].join(',');
        const rows = logs.map(log => [
            `"${log.id}"`,
            `"${log.type}"`,
            `"${log.status}"`,
            `"${log.action?.replace(/"/g, '""') || ''}"`,
            `"${log.message?.replace(/"/g, '""') || ''}"`,
            `"${log.details?.replace(/"/g, '""') || ''}"`,
            log.duration || '',
            log.startedAt ? `"${log.startedAt.toISOString()}"` : '',
            log.completedAt ? `"${log.completedAt.toISOString()}"` : '',
            `"${log.createdAt.toISOString()}"`,
        ].join(','));
        return [header, ...rows].join('\n');
    }
};
exports.LogsService = LogsService;
exports.LogsService = LogsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(log_entity_1.Log)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], LogsService);
//# sourceMappingURL=logs.service.js.map