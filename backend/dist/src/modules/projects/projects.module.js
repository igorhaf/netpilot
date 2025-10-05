"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const projects_service_1 = require("./projects.service");
const projects_controller_1 = require("./projects.controller");
const project_entity_1 = require("../../entities/project.entity");
const stack_entity_1 = require("../../entities/stack.entity");
const preset_entity_1 = require("../../entities/preset.entity");
const job_queue_entity_1 = require("../../entities/job-queue.entity");
const job_execution_entity_1 = require("../../entities/job-execution.entity");
const logs_module_1 = require("../logs/logs.module");
const chat_module_1 = require("../chat/chat.module");
let ProjectsModule = class ProjectsModule {
};
exports.ProjectsModule = ProjectsModule;
exports.ProjectsModule = ProjectsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([project_entity_1.Project, stack_entity_1.Stack, preset_entity_1.Preset, job_queue_entity_1.JobQueue, job_execution_entity_1.JobExecution]),
            logs_module_1.LogsModule,
            chat_module_1.ChatModule,
        ],
        controllers: [projects_controller_1.ProjectsController],
        providers: [projects_service_1.ProjectsService],
        exports: [projects_service_1.ProjectsService],
    })
], ProjectsModule);
//# sourceMappingURL=projects.module.js.map