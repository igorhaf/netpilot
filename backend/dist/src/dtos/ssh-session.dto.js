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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandExecutionResponseDto = exports.SshSessionResponseDto = exports.ExecuteCommandDto = exports.ConnectSshSessionDto = exports.UpdateSshSessionDto = exports.CreateSshSessionDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class CreateSshSessionDto {
}
exports.CreateSshSessionDto = CreateSshSessionDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Nome da sessão SSH',
        example: 'Servidor Produção',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MinLength)(3),
    __metadata("design:type", String)
], CreateSshSessionDto.prototype, "sessionName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Hostname ou IP do servidor',
        example: '192.168.1.100',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateSshSessionDto.prototype, "hostname", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Porta SSH',
        example: 22,
        minimum: 1,
        maximum: 65535,
    }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(65535),
    __metadata("design:type", Number)
], CreateSshSessionDto.prototype, "port", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Nome de usuário SSH',
        example: 'admin',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateSshSessionDto.prototype, "username", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Tipo de autenticação',
        enum: ['password', 'key'],
        example: 'password',
    }),
    (0, class_validator_1.IsEnum)(['password', 'key']),
    __metadata("design:type", String)
], CreateSshSessionDto.prototype, "authType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Senha (obrigatório se authType for password)',
        example: 'password123',
    }),
    (0, class_validator_1.ValidateIf)((o) => o.authType === 'password'),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateSshSessionDto.prototype, "password", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Chave privada SSH (obrigatório se authType for key)',
    }),
    (0, class_validator_1.ValidateIf)((o) => o.authType === 'key'),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateSshSessionDto.prototype, "privateKey", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Passphrase da chave privada',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSshSessionDto.prototype, "passphrase", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Descrição da sessão',
        example: 'Servidor de produção principal',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSshSessionDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Opções adicionais de conexão',
        example: {
            keepaliveInterval: 60000,
            readyTimeout: 20000,
            algorithms: {
                kex: ['diffie-hellman-group1-sha1'],
                cipher: ['aes128-ctr', 'aes192-ctr'],
            },
        },
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreateSshSessionDto.prototype, "connectionOptions", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Se a sessão está ativa',
        example: true,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateSshSessionDto.prototype, "isActive", void 0);
class UpdateSshSessionDto extends (0, swagger_1.PartialType)(CreateSshSessionDto) {
}
exports.UpdateSshSessionDto = UpdateSshSessionDto;
class ConnectSshSessionDto {
}
exports.ConnectSshSessionDto = ConnectSshSessionDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ID da sessão SSH para conectar',
        example: 'uuid-session-id',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ConnectSshSessionDto.prototype, "sessionId", void 0);
class ExecuteCommandDto {
}
exports.ExecuteCommandDto = ExecuteCommandDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Comando a ser executado',
        example: 'ls -la',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ExecuteCommandDto.prototype, "command", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ID da sessão SSH',
        example: 'uuid-session-id',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ExecuteCommandDto.prototype, "sessionId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Diretório de trabalho',
        example: '/home/user',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ExecuteCommandDto.prototype, "workingDirectory", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Variáveis de ambiente',
        example: {
            NODE_ENV: 'production',
            PATH: '/usr/local/bin:/usr/bin',
        },
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], ExecuteCommandDto.prototype, "environment", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Timeout em milissegundos',
        example: 30000,
        minimum: 1000,
        maximum: 300000,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1000),
    (0, class_validator_1.Max)(300000),
    __metadata("design:type", Number)
], ExecuteCommandDto.prototype, "timeout", void 0);
class SshSessionResponseDto {
}
exports.SshSessionResponseDto = SshSessionResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ID da sessão',
        example: 'uuid-session-id',
    }),
    __metadata("design:type", String)
], SshSessionResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Nome da sessão',
        example: 'Servidor Produção',
    }),
    __metadata("design:type", String)
], SshSessionResponseDto.prototype, "sessionName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Hostname',
        example: '192.168.1.100',
    }),
    __metadata("design:type", String)
], SshSessionResponseDto.prototype, "hostname", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Porta SSH',
        example: 22,
    }),
    __metadata("design:type", Number)
], SshSessionResponseDto.prototype, "port", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Nome de usuário',
        example: 'admin',
    }),
    __metadata("design:type", String)
], SshSessionResponseDto.prototype, "username", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Tipo de autenticação',
        example: 'password',
    }),
    __metadata("design:type", String)
], SshSessionResponseDto.prototype, "authType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Status da sessão',
        example: 'active',
    }),
    __metadata("design:type", String)
], SshSessionResponseDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Última conexão',
        example: '2024-01-01T12:00:00Z',
    }),
    __metadata("design:type", Date)
], SshSessionResponseDto.prototype, "lastConnectedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Contagem de comandos executados',
        example: 42,
    }),
    __metadata("design:type", Number)
], SshSessionResponseDto.prototype, "commandCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Data de criação',
        example: '2024-01-01T10:00:00Z',
    }),
    __metadata("design:type", Date)
], SshSessionResponseDto.prototype, "createdAt", void 0);
class CommandExecutionResponseDto {
}
exports.CommandExecutionResponseDto = CommandExecutionResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ID do log de execução',
        example: 'uuid-log-id',
    }),
    __metadata("design:type", String)
], CommandExecutionResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Comando executado',
        example: 'ls -la',
    }),
    __metadata("design:type", String)
], CommandExecutionResponseDto.prototype, "command", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Saída do comando',
        example: 'total 24\ndrwxr-xr-x 3 user user 4096 Jan 1 12:00 .',
    }),
    __metadata("design:type", String)
], CommandExecutionResponseDto.prototype, "output", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Saída de erro',
        example: '',
    }),
    __metadata("design:type", String)
], CommandExecutionResponseDto.prototype, "errorOutput", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Código de saída',
        example: 0,
    }),
    __metadata("design:type", Number)
], CommandExecutionResponseDto.prototype, "exitCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Tempo de execução em ms',
        example: 150,
    }),
    __metadata("design:type", Number)
], CommandExecutionResponseDto.prototype, "executionTime", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Status da execução',
        example: 'completed',
    }),
    __metadata("design:type", String)
], CommandExecutionResponseDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Data de execução',
        example: '2024-01-01T12:00:00Z',
    }),
    __metadata("design:type", Date)
], CommandExecutionResponseDto.prototype, "executedAt", void 0);
//# sourceMappingURL=ssh-session.dto.js.map