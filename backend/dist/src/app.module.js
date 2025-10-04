"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const bull_1 = require("@nestjs/bull");
const cache_manager_1 = require("@nestjs/cache-manager");
const auth_module_1 = require("./modules/auth/auth.module");
const projects_module_1 = require("./modules/projects/projects.module");
const domains_module_1 = require("./modules/domains/domains.module");
const proxy_rules_module_1 = require("./modules/proxy-rules/proxy-rules.module");
const redirects_module_1 = require("./modules/redirects/redirects.module");
const ssl_certificates_module_1 = require("./modules/ssl-certificates/ssl-certificates.module");
const logs_module_1 = require("./modules/logs/logs.module");
const dashboard_module_1 = require("./modules/dashboard/dashboard.module");
const console_module_1 = require("./modules/console/console.module");
const docker_minimal_module_1 = require("./modules/docker/docker-minimal.module");
const websocket_module_1 = require("./modules/websocket/websocket.module");
const terminal_module_1 = require("./modules/terminal/terminal.module");
const job_queues_module_1 = require("./modules/job-queues/job-queues.module");
const redis_module_1 = require("./modules/redis/redis.module");
const seed_module_1 = require("./seeds/seed.module");
const config_module_1 = require("./modules/config/config.module");
const settings_module_1 = require("./modules/settings/settings.module");
const stacks_module_1 = require("./modules/stacks/stacks.module");
const presets_module_1 = require("./modules/presets/presets.module");
const database_module_1 = require("./modules/database/database.module");
const chat_module_1 = require("./modules/chat/chat.module");
const user_entity_1 = require("./entities/user.entity");
const project_entity_1 = require("./entities/project.entity");
const domain_entity_1 = require("./entities/domain.entity");
const proxy_rule_entity_1 = require("./entities/proxy-rule.entity");
const redirect_entity_1 = require("./entities/redirect.entity");
const ssl_certificate_entity_1 = require("./entities/ssl-certificate.entity");
const log_entity_1 = require("./entities/log.entity");
const ssh_session_entity_1 = require("./entities/ssh-session.entity");
const console_log_entity_1 = require("./entities/console-log.entity");
const job_queue_entity_1 = require("./entities/job-queue.entity");
const job_execution_entity_1 = require("./entities/job-execution.entity");
const job_schedule_entity_1 = require("./entities/job-schedule.entity");
const settings_entity_1 = require("./modules/settings/settings.entity");
const stack_entity_1 = require("./entities/stack.entity");
const preset_entity_1 = require("./entities/preset.entity");
const chat_message_entity_1 = require("./entities/chat-message.entity");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
            }),
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                useFactory: (configService) => ({
                    type: 'postgres',
                    url: configService.get('DATABASE_URL'),
                    entities: [user_entity_1.User, project_entity_1.Project, domain_entity_1.Domain, proxy_rule_entity_1.ProxyRule, redirect_entity_1.Redirect, ssl_certificate_entity_1.SslCertificate, log_entity_1.Log, ssh_session_entity_1.SshSession, console_log_entity_1.ConsoleLog, job_queue_entity_1.JobQueue, job_execution_entity_1.JobExecution, job_schedule_entity_1.JobSchedule, settings_entity_1.Setting, stack_entity_1.Stack, preset_entity_1.Preset, chat_message_entity_1.ChatMessage],
                    synchronize: true,
                    logging: process.env.NODE_ENV === 'development',
                }),
                inject: [config_1.ConfigService],
            }),
            bull_1.BullModule.forRootAsync({
                imports: [config_1.ConfigModule],
                useFactory: (configService) => ({
                    redis: {
                        host: configService.get('REDIS_HOST', 'localhost'),
                        port: configService.get('REDIS_PORT', 6379),
                        password: configService.get('REDIS_PASSWORD'),
                    },
                }),
                inject: [config_1.ConfigService],
            }),
            cache_manager_1.CacheModule.registerAsync({
                imports: [config_1.ConfigModule],
                useFactory: (configService) => ({
                    ttl: 300000,
                    max: 100,
                }),
                inject: [config_1.ConfigService],
                isGlobal: true,
            }),
            config_module_1.ConfigModule,
            auth_module_1.AuthModule,
            projects_module_1.ProjectsModule,
            domains_module_1.DomainsModule,
            proxy_rules_module_1.ProxyRulesModule,
            redirects_module_1.RedirectsModule,
            ssl_certificates_module_1.SslCertificatesModule,
            logs_module_1.LogsModule,
            dashboard_module_1.DashboardModule,
            console_module_1.ConsoleModule,
            docker_minimal_module_1.DockerMinimalModule,
            websocket_module_1.WebSocketModule,
            terminal_module_1.TerminalModule,
            job_queues_module_1.JobQueuesModule,
            redis_module_1.RedisModule,
            seed_module_1.SeedModule,
            settings_module_1.SettingsModule,
            stacks_module_1.StacksModule,
            presets_module_1.PresetsModule,
            database_module_1.DatabaseModule,
            chat_module_1.ChatModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map