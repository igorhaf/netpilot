"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketModule = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const typeorm_1 = require("@nestjs/typeorm");
const websocket_gateway_1 = require("./websocket.gateway");
const websocket_service_1 = require("./services/websocket.service");
const ssh_websocket_handler_1 = require("./handlers/ssh-websocket.handler");
const ssh_session_entity_1 = require("../../entities/ssh-session.entity");
const console_log_entity_1 = require("../../entities/console-log.entity");
const console_service_1 = require("../console/console.service");
const websocket_rate_limit_guard_1 = require("./guards/websocket-rate-limit.guard");
let WebSocketModule = class WebSocketModule {
};
exports.WebSocketModule = WebSocketModule;
exports.WebSocketModule = WebSocketModule = __decorate([
    (0, common_1.Module)({
        imports: [
            jwt_1.JwtModule.register({}),
            typeorm_1.TypeOrmModule.forFeature([ssh_session_entity_1.SshSession, console_log_entity_1.ConsoleLog]),
        ],
        providers: [
            websocket_gateway_1.WebSocketGateway,
            websocket_service_1.WebSocketService,
            ssh_websocket_handler_1.SshWebSocketHandler,
            websocket_rate_limit_guard_1.WebSocketRateLimitGuard,
            console_service_1.ConsoleService
        ],
        exports: [websocket_service_1.WebSocketService, websocket_gateway_1.WebSocketGateway, ssh_websocket_handler_1.SshWebSocketHandler]
    })
], WebSocketModule);
//# sourceMappingURL=websocket.module.js.map