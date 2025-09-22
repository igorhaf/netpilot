"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DockerModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const bull_1 = require("@nestjs/bull");
const docker_job_entity_1 = require("./entities/docker-job.entity");
const docker_backup_entity_1 = require("./entities/docker-backup.entity");
const docker_event_entity_1 = require("./entities/docker-event.entity");
const docker_quota_entity_1 = require("./entities/docker-quota.entity");
const containers_controller_1 = require("./controllers/containers.controller");
const volumes_controller_1 = require("./controllers/volumes.controller");
const networks_controller_1 = require("./controllers/networks.controller");
const images_controller_1 = require("./controllers/images.controller");
const jobs_controller_1 = require("./controllers/jobs.controller");
const test_controller_1 = require("./controllers/test.controller");
const docker_service_1 = require("./services/docker.service");
const containers_service_1 = require("./services/containers.service");
const volumes_service_1 = require("./services/volumes.service");
const networks_service_1 = require("./services/networks.service");
const images_service_1 = require("./services/images.service");
const jobs_service_1 = require("./services/jobs.service");
const docker_events_service_1 = require("./services/docker-events.service");
const docker_metrics_service_1 = require("./services/docker-metrics.service");
const docker_quota_guard_1 = require("./guards/docker-quota.guard");
const docker_rbac_guard_1 = require("./guards/docker-rbac.guard");
let DockerModule = class DockerModule {
};
exports.DockerModule = DockerModule;
exports.DockerModule = DockerModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                docker_job_entity_1.DockerJob,
                docker_backup_entity_1.DockerBackup,
                docker_event_entity_1.DockerEvent,
                docker_quota_entity_1.DockerQuota
            ]),
            bull_1.BullModule.registerQueue({
                name: 'docker',
            }),
        ],
        controllers: [
            test_controller_1.TestController,
            containers_controller_1.ContainersController,
            volumes_controller_1.VolumesController,
            networks_controller_1.NetworksController,
            images_controller_1.ImagesController,
            jobs_controller_1.JobsController,
        ],
        providers: [
            {
                provide: 'DOCKER_CONFIG',
                useValue: {
                    socketPath: process.env.DOCKER_SOCKET_PATH || '/var/run/docker.sock',
                    host: process.env.DOCKER_HOST,
                    port: process.env.DOCKER_PORT ? parseInt(process.env.DOCKER_PORT) : undefined,
                },
            },
            docker_service_1.DockerService,
            containers_service_1.ContainersService,
            volumes_service_1.VolumesService,
            networks_service_1.NetworksService,
            images_service_1.ImagesService,
            jobs_service_1.JobsService,
            docker_events_service_1.DockerEventsService,
            docker_metrics_service_1.DockerMetricsService,
            docker_quota_guard_1.DockerQuotaGuard,
            docker_rbac_guard_1.DockerRbacGuard,
        ],
        exports: [
            docker_service_1.DockerService,
            docker_metrics_service_1.DockerMetricsService,
        ],
    })
], DockerModule);
//# sourceMappingURL=docker.module.js.map