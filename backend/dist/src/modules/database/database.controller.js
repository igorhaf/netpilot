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
exports.DatabaseController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../guards/jwt-auth.guard");
const database_service_1 = require("./database.service");
let DatabaseController = class DatabaseController {
    constructor(databaseService) {
        this.databaseService = databaseService;
    }
    async getDatabaseInfo(dbType = 'postgres') {
        return this.databaseService.getDatabaseInfo(dbType);
    }
    async getTables(dbType = 'postgres') {
        return this.databaseService.getTables(dbType);
    }
    async getTableData(table, dbType = 'postgres', page = '1', limit = '50') {
        return this.databaseService.getTableData(table, dbType, parseInt(page), parseInt(limit));
    }
    async getTableStructure(table, dbType = 'postgres') {
        return this.databaseService.getTableStructure(table, dbType);
    }
    async executeQuery(body) {
        return this.databaseService.executeQuery(body.query, body.dbType || 'postgres', body.params || [], body.allowDestructive || false);
    }
    async insertRow(body) {
        return this.databaseService.insertRow(body.table, body.dbType || 'postgres', body.data);
    }
    async updateRow(body) {
        return this.databaseService.updateRow(body.table, body.dbType || 'postgres', body.data, body.where);
    }
    async deleteRow(body) {
        return this.databaseService.deleteRow(body.table, body.dbType || 'postgres', body.where);
    }
    async exportData(table, dbType = 'postgres', format = 'json') {
        return this.databaseService.exportData(table, dbType, format);
    }
};
exports.DatabaseController = DatabaseController;
__decorate([
    (0, common_1.Get)('info'),
    (0, swagger_1.ApiOperation)({ summary: 'Get database information and statistics' }),
    __param(0, (0, common_1.Query)('dbType')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DatabaseController.prototype, "getDatabaseInfo", null);
__decorate([
    (0, common_1.Get)('tables'),
    (0, swagger_1.ApiOperation)({ summary: 'List all database tables' }),
    __param(0, (0, common_1.Query)('dbType')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DatabaseController.prototype, "getTables", null);
__decorate([
    (0, common_1.Get)('table-data'),
    (0, swagger_1.ApiOperation)({ summary: 'Get data from a specific table' }),
    __param(0, (0, common_1.Query)('table')),
    __param(1, (0, common_1.Query)('dbType')),
    __param(2, (0, common_1.Query)('page')),
    __param(3, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], DatabaseController.prototype, "getTableData", null);
__decorate([
    (0, common_1.Get)('table-structure'),
    (0, swagger_1.ApiOperation)({ summary: 'Get structure of a specific table' }),
    __param(0, (0, common_1.Query)('table')),
    __param(1, (0, common_1.Query)('dbType')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], DatabaseController.prototype, "getTableStructure", null);
__decorate([
    (0, common_1.Post)('query'),
    (0, swagger_1.ApiOperation)({ summary: 'Execute a SQL query' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DatabaseController.prototype, "executeQuery", null);
__decorate([
    (0, common_1.Post)('insert-row'),
    (0, swagger_1.ApiOperation)({ summary: 'Insert a new row into a table' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DatabaseController.prototype, "insertRow", null);
__decorate([
    (0, common_1.Post)('update-row'),
    (0, swagger_1.ApiOperation)({ summary: 'Update a row in a table' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DatabaseController.prototype, "updateRow", null);
__decorate([
    (0, common_1.Post)('delete-row'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a row from a table' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DatabaseController.prototype, "deleteRow", null);
__decorate([
    (0, common_1.Get)('export'),
    (0, swagger_1.ApiOperation)({ summary: 'Export table data' }),
    __param(0, (0, common_1.Query)('table')),
    __param(1, (0, common_1.Query)('dbType')),
    __param(2, (0, common_1.Query)('format')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], DatabaseController.prototype, "exportData", null);
exports.DatabaseController = DatabaseController = __decorate([
    (0, swagger_1.ApiTags)('Database'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('database'),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], DatabaseController);
//# sourceMappingURL=database.controller.js.map