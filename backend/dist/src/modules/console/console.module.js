"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConsoleModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const console_service_1 = require("./console.service");
const console_controller_1 = require("./console.controller");
const console_gateway_1 = require("./console.gateway");
const ssh_session_entity_1 = require("../../entities/ssh-session.entity");
const console_log_entity_1 = require("../../entities/console-log.entity");
let ConsoleModule = class ConsoleModule {
};
exports.ConsoleModule = ConsoleModule;
exports.ConsoleModule = ConsoleModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([ssh_session_entity_1.SshSession, console_log_entity_1.ConsoleLog])
        ],
        controllers: [console_controller_1.ConsoleController],
        providers: [console_service_1.ConsoleService, console_gateway_1.ConsoleGateway],
        exports: [console_service_1.ConsoleService, console_gateway_1.ConsoleGateway],
    })
], ConsoleModule);
//# sourceMappingURL=console.module.js.map