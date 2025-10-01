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
exports.DockerProxyController = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("axios");
let DockerProxyController = class DockerProxyController {
    constructor() {
        this.pythonServiceUrl = process.env.SYSTEM_OPS_URL || process.env.PYTHON_SERVICE_URL || 'http://host.docker.internal:8001';
    }
    async proxyRequest(req, res) {
        try {
            const originalUrl = req.originalUrl || req.url;
            const match = originalUrl.match(/\/api\/docker(\/.*)$/);
            const path = match ? match[1] : '';
            const method = req.method.toLowerCase();
            const url = `${this.pythonServiceUrl}/docker${path}`;
            console.log(`[Docker Proxy] ${method.toUpperCase()} ${url}`);
            const response = await (0, axios_1.default)({
                method: method,
                url: url,
                data: req.body,
                params: req.query,
                headers: {
                    ...req.headers,
                    host: undefined,
                },
                validateStatus: () => true,
            });
            const headersToRemove = ['content-encoding', 'transfer-encoding', 'connection'];
            Object.keys(response.headers).forEach(key => {
                if (!headersToRemove.includes(key.toLowerCase())) {
                    res.setHeader(key, response.headers[key]);
                }
            });
            return res.status(response.status).send(response.data);
        }
        catch (error) {
            console.error('[Docker Proxy] Error:', error.message);
            return res.status(500).json({
                success: false,
                message: 'Proxy error: ' + error.message,
            });
        }
    }
};
exports.DockerProxyController = DockerProxyController;
__decorate([
    (0, common_1.All)('*'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], DockerProxyController.prototype, "proxyRequest", null);
exports.DockerProxyController = DockerProxyController = __decorate([
    (0, common_1.Controller)('docker')
], DockerProxyController);
//# sourceMappingURL=docker-proxy.controller.js.map