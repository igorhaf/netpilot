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
exports.DockerEventsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const docker_event_entity_1 = require("../entities/docker-event.entity");
let DockerEventsService = class DockerEventsService {
    constructor(eventsRepo) {
        this.eventsRepo = eventsRepo;
    }
    async logEvent(data) {
        const event = this.eventsRepo.create({
            action: data.action,
            resource_type: data.resource_type,
            resource_id: data.resource_id,
            resource_name: data.resource_name,
            details: data.details,
            result: data.result,
            error_message: data.error_message,
            user: data.user,
            ip_address: data.ip_address,
            user_agent: data.user_agent
        });
        return await this.eventsRepo.save(event);
    }
    async getEvents(filters) {
        const query = this.eventsRepo.createQueryBuilder('event')
            .leftJoinAndSelect('event.user', 'user')
            .orderBy('event.created_at', 'DESC');
        if (filters?.user_id) {
            query.andWhere('event.user_id = :userId', { userId: filters.user_id });
        }
        if (filters?.resource_type) {
            query.andWhere('event.resource_type = :resourceType', { resourceType: filters.resource_type });
        }
        if (filters?.action) {
            query.andWhere('event.action = :action', { action: filters.action });
        }
        if (filters?.result) {
            query.andWhere('event.result = :result', { result: filters.result });
        }
        if (filters?.since) {
            query.andWhere('event.created_at >= :since', { since: filters.since });
        }
        if (filters?.until) {
            query.andWhere('event.created_at <= :until', { until: filters.until });
        }
        const total = await query.getCount();
        if (filters?.limit) {
            query.limit(filters.limit);
        }
        if (filters?.offset) {
            query.offset(filters.offset);
        }
        const events = await query.getMany();
        return { events, total };
    }
    async getEventStats(since) {
        const query = this.eventsRepo.createQueryBuilder('event');
        if (since) {
            query.where('event.created_at >= :since', { since });
        }
        const total = await query.getCount();
        const byAction = await query
            .select('event.action', 'action')
            .addSelect('COUNT(*)', 'count')
            .groupBy('event.action')
            .getRawMany();
        const byResult = await query
            .select('event.result', 'result')
            .addSelect('COUNT(*)', 'count')
            .groupBy('event.result')
            .getRawMany();
        const byResourceType = await query
            .select('event.resource_type', 'resource_type')
            .addSelect('COUNT(*)', 'count')
            .groupBy('event.resource_type')
            .getRawMany();
        return {
            total,
            by_action: byAction,
            by_result: byResult,
            by_resource_type: byResourceType
        };
    }
};
exports.DockerEventsService = DockerEventsService;
exports.DockerEventsService = DockerEventsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(docker_event_entity_1.DockerEvent)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], DockerEventsService);
//# sourceMappingURL=docker-events.service.js.map