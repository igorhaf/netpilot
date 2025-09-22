"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DockerMetricsService = void 0;
const common_1 = require("@nestjs/common");
const prom_client_1 = require("prom-client");
let DockerMetricsService = class DockerMetricsService {
    constructor() {
        this.containerActionsTotal = new prom_client_1.Counter({
            name: 'docker_container_actions_total',
            help: 'Total number of container actions performed',
            labelNames: ['action', 'status', 'user_id'],
            registers: [prom_client_1.register]
        });
        this.containerActionDuration = new prom_client_1.Histogram({
            name: 'docker_container_action_duration_seconds',
            help: 'Duration of container actions in seconds',
            labelNames: ['action'],
            buckets: [0.1, 0.5, 1, 2, 5, 10, 30],
            registers: [prom_client_1.register]
        });
        this.activeContainers = new prom_client_1.Gauge({
            name: 'docker_active_containers',
            help: 'Number of active containers by state',
            labelNames: ['state'],
            registers: [prom_client_1.register]
        });
        this.volumeUsage = new prom_client_1.Gauge({
            name: 'docker_volume_usage_bytes',
            help: 'Volume usage in bytes',
            labelNames: ['volume_name'],
            registers: [prom_client_1.register]
        });
        this.jobsActive = new prom_client_1.Gauge({
            name: 'docker_jobs_active',
            help: 'Number of active Docker jobs by type',
            labelNames: ['type'],
            registers: [prom_client_1.register]
        });
        this.apiRequestsTotal = new prom_client_1.Counter({
            name: 'docker_api_requests_total',
            help: 'Total number of Docker API requests',
            labelNames: ['method', 'endpoint', 'status_code'],
            registers: [prom_client_1.register]
        });
    }
    recordContainerAction(action, status, userId, duration) {
        this.containerActionsTotal.inc({ action, status, user_id: userId });
        if (duration !== undefined) {
            this.containerActionDuration.observe({ action }, duration);
        }
    }
    updateContainerStats(containers) {
        const states = containers.reduce((acc, container) => {
            acc[container.state] = (acc[container.state] || 0) + 1;
            return acc;
        }, {});
        ['running', 'exited', 'paused', 'created', 'restarting'].forEach(state => {
            this.activeContainers.set({ state }, states[state] || 0);
        });
    }
    updateVolumeUsage(volumes) {
        volumes.forEach(volume => {
            if (volume.usage?.size) {
                this.volumeUsage.set({ volume_name: volume.name }, volume.usage.size);
            }
        });
    }
    updateJobsStats(jobs) {
        const jobsByType = jobs.reduce((acc, job) => {
            if (job.status === 'running' || job.status === 'pending') {
                acc[job.type] = (acc[job.type] || 0) + 1;
            }
            return acc;
        }, {});
        ['backup', 'restore', 'pull', 'prune'].forEach(type => {
            this.jobsActive.set({ type }, jobsByType[type] || 0);
        });
    }
    recordApiRequest(method, endpoint, statusCode) {
        this.apiRequestsTotal.inc({ method, endpoint, status_code: statusCode.toString() });
    }
};
exports.DockerMetricsService = DockerMetricsService;
exports.DockerMetricsService = DockerMetricsService = __decorate([
    (0, common_1.Injectable)()
], DockerMetricsService);
//# sourceMappingURL=docker-metrics.service.js.map