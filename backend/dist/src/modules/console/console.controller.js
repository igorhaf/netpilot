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
exports.ConsoleController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const console_service_1 = require("./console.service");
const jwt_auth_guard_1 = require("../../guards/jwt-auth.guard");
const ssh_session_dto_1 = require("../../dtos/ssh-session.dto");
let ConsoleController = class ConsoleController {
    constructor(consoleService) {
        this.consoleService = consoleService;
    }
    async createSession(req, createSshSessionDto) {
        return this.consoleService.createSession(req.user.userId, createSshSessionDto);
    }
    async findAllSessions(req) {
        return this.consoleService.findUserSessions(req.user.userId);
    }
    async getSessionStats(req) {
        return this.consoleService.getUserSessionStats(req.user.userId);
    }
    async findSession(req, id) {
        return this.consoleService.findSessionById(req.user.userId, id);
    }
    async updateSession(req, id, updateSshSessionDto) {
        return this.consoleService.updateSession(req.user.userId, id, updateSshSessionDto);
    }
    async removeSession(req, id) {
        await this.consoleService.deleteSession(req.user.userId, id);
        return { message: 'Sessão removida com sucesso' };
    }
    async connectSession(req, sessionId) {
        const connected = await this.consoleService.connectToSession(req.user.userId, sessionId);
        return {
            sessionId,
            connected,
            message: connected ? 'Conectado com sucesso' : 'Falha na conexão'
        };
    }
    async disconnectSession(req, sessionId) {
        await this.consoleService.disconnectSession(req.user.userId, sessionId);
        return {
            sessionId,
            message: 'Desconectado com sucesso'
        };
    }
    async getSessionStatus(req, sessionId) {
        const connected = this.consoleService.isSessionConnected(req.user.userId, sessionId);
        return {
            sessionId,
            connected,
            status: connected ? 'connected' : 'disconnected'
        };
    }
    async executeCommand(req, executeCommandDto) {
        return this.consoleService.executeCommand(req.user.userId, executeCommandDto);
    }
    async getCommandLogs(req, sessionId, page, limit) {
        return this.consoleService.getCommandLogs(req.user.userId, sessionId, page, limit);
    }
    async getAllCommandLogs(req, page, limit, sessionId) {
        if (sessionId) {
            return this.consoleService.getCommandLogs(req.user.userId, sessionId, page, limit);
        }
        return { logs: [], total: 0 };
    }
};
exports.ConsoleController = ConsoleController;
__decorate([
    (0, common_1.Post)('sessions'),
    (0, swagger_1.ApiOperation)({ summary: 'Criar nova sessão SSH' }),
    (0, swagger_1.ApiResponse)({ type: ssh_session_dto_1.SshSessionResponseDto }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, ssh_session_dto_1.CreateSshSessionDto]),
    __metadata("design:returntype", Promise)
], ConsoleController.prototype, "createSession", null);
__decorate([
    (0, common_1.Get)('sessions'),
    (0, swagger_1.ApiOperation)({ summary: 'Listar sessões SSH do usuário' }),
    (0, swagger_1.ApiResponse)({ type: [ssh_session_dto_1.SshSessionResponseDto] }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ConsoleController.prototype, "findAllSessions", null);
__decorate([
    (0, common_1.Get)('sessions/stats'),
    (0, swagger_1.ApiOperation)({ summary: 'Obter estatísticas das sessões' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ConsoleController.prototype, "getSessionStats", null);
__decorate([
    (0, common_1.Get)('sessions/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Obter sessão SSH por ID' }),
    (0, swagger_1.ApiResponse)({ type: ssh_session_dto_1.SshSessionResponseDto }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ConsoleController.prototype, "findSession", null);
__decorate([
    (0, common_1.Patch)('sessions/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Atualizar sessão SSH' }),
    (0, swagger_1.ApiResponse)({ type: ssh_session_dto_1.SshSessionResponseDto }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, ssh_session_dto_1.UpdateSshSessionDto]),
    __metadata("design:returntype", Promise)
], ConsoleController.prototype, "updateSession", null);
__decorate([
    (0, common_1.Delete)('sessions/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Deletar sessão SSH' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ConsoleController.prototype, "removeSession", null);
__decorate([
    (0, common_1.Post)('sessions/:id/connect'),
    (0, swagger_1.ApiOperation)({ summary: 'Conectar à sessão SSH' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ConsoleController.prototype, "connectSession", null);
__decorate([
    (0, common_1.Post)('sessions/:id/disconnect'),
    (0, swagger_1.ApiOperation)({ summary: 'Desconectar da sessão SSH' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ConsoleController.prototype, "disconnectSession", null);
__decorate([
    (0, common_1.Get)('sessions/:id/status'),
    (0, swagger_1.ApiOperation)({ summary: 'Verificar status de conexão da sessão' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ConsoleController.prototype, "getSessionStatus", null);
__decorate([
    (0, common_1.Post)('execute'),
    (0, swagger_1.ApiOperation)({ summary: 'Executar comando SSH' }),
    (0, swagger_1.ApiResponse)({ type: ssh_session_dto_1.CommandExecutionResponseDto }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, ssh_session_dto_1.ExecuteCommandDto]),
    __metadata("design:returntype", Promise)
], ConsoleController.prototype, "executeCommand", null);
__decorate([
    (0, common_1.Get)('sessions/:id/logs'),
    (0, swagger_1.ApiOperation)({ summary: 'Obter logs de comandos da sessão' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Query)('page', new common_1.DefaultValuePipe(1), common_1.ParseIntPipe)),
    __param(3, (0, common_1.Query)('limit', new common_1.DefaultValuePipe(50), common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Number, Number]),
    __metadata("design:returntype", Promise)
], ConsoleController.prototype, "getCommandLogs", null);
__decorate([
    (0, common_1.Get)('logs'),
    (0, swagger_1.ApiOperation)({ summary: 'Obter todos os logs de comandos do usuário' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('page', new common_1.DefaultValuePipe(1), common_1.ParseIntPipe)),
    __param(2, (0, common_1.Query)('limit', new common_1.DefaultValuePipe(50), common_1.ParseIntPipe)),
    __param(3, (0, common_1.Query)('sessionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Number, String]),
    __metadata("design:returntype", Promise)
], ConsoleController.prototype, "getAllCommandLogs", null);
exports.ConsoleController = ConsoleController = __decorate([
    (0, swagger_1.ApiTags)('console'),
    (0, common_1.Controller)('console'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [console_service_1.ConsoleService])
], ConsoleController);
//# sourceMappingURL=console.controller.js.map