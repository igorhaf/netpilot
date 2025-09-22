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
var WebSocketRateLimitGuard_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnectionRateLimit = exports.CommandRateLimit = exports.StrictRateLimit = exports.ModerateRateLimit = exports.LightRateLimit = exports.WebSocketRateLimitGuard = exports.RateLimit = exports.RATE_LIMIT_KEY = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const cache_manager_1 = require("@nestjs/cache-manager");
const common_2 = require("@nestjs/common");
exports.RATE_LIMIT_KEY = 'rate_limit';
const RateLimit = (options) => {
    return (target, propertyName, descriptor) => {
        Reflect.defineMetadata(exports.RATE_LIMIT_KEY, options, descriptor.value);
        return descriptor;
    };
};
exports.RateLimit = RateLimit;
let WebSocketRateLimitGuard = WebSocketRateLimitGuard_1 = class WebSocketRateLimitGuard {
    constructor(reflector, cacheManager) {
        this.reflector = reflector;
        this.cacheManager = cacheManager;
        this.logger = new common_1.Logger(WebSocketRateLimitGuard_1.name);
    }
    async canActivate(context) {
        const rateLimitOptions = this.reflector.get(exports.RATE_LIMIT_KEY, context.getHandler());
        if (!rateLimitOptions) {
            return true;
        }
        const client = context.switchToWs().getClient();
        const data = context.switchToWs().getData();
        if (!client.userId) {
            return true;
        }
        const key = `rate_limit:${client.userId}:${context.getHandler().name}`;
        const windowStart = Math.floor(Date.now() / rateLimitOptions.windowMs) * rateLimitOptions.windowMs;
        const windowKey = `${key}:${windowStart}`;
        try {
            const currentCount = await this.cacheManager.get(windowKey) || 0;
            if (currentCount >= rateLimitOptions.maxRequests) {
                this.logger.warn(`Rate limit exceeded for user ${client.userId} on ${context.getHandler().name}. ` +
                    `${currentCount}/${rateLimitOptions.maxRequests} requests in ${rateLimitOptions.windowMs}ms window`);
                client.emit('error', {
                    type: 'RATE_LIMIT_EXCEEDED',
                    message: 'Too many requests. Please slow down.',
                    retryAfter: rateLimitOptions.windowMs - (Date.now() % rateLimitOptions.windowMs)
                });
                return false;
            }
            await this.cacheManager.set(windowKey, currentCount + 1, rateLimitOptions.windowMs);
            return true;
        }
        catch (error) {
            this.logger.error(`Rate limiting error for user ${client.userId}:`, error);
            return true;
        }
    }
};
exports.WebSocketRateLimitGuard = WebSocketRateLimitGuard;
exports.WebSocketRateLimitGuard = WebSocketRateLimitGuard = WebSocketRateLimitGuard_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_2.Inject)(cache_manager_1.CACHE_MANAGER)),
    __metadata("design:paramtypes", [core_1.Reflector,
        cache_manager_1.Cache])
], WebSocketRateLimitGuard);
const LightRateLimit = () => (0, exports.RateLimit)({
    windowMs: 60 * 1000,
    maxRequests: 60
});
exports.LightRateLimit = LightRateLimit;
const ModerateRateLimit = () => (0, exports.RateLimit)({
    windowMs: 60 * 1000,
    maxRequests: 20
});
exports.ModerateRateLimit = ModerateRateLimit;
const StrictRateLimit = () => (0, exports.RateLimit)({
    windowMs: 60 * 1000,
    maxRequests: 5
});
exports.StrictRateLimit = StrictRateLimit;
const CommandRateLimit = () => (0, exports.RateLimit)({
    windowMs: 10 * 1000,
    maxRequests: 10
});
exports.CommandRateLimit = CommandRateLimit;
const ConnectionRateLimit = () => (0, exports.RateLimit)({
    windowMs: 60 * 1000,
    maxRequests: 3
});
exports.ConnectionRateLimit = ConnectionRateLimit;
//# sourceMappingURL=websocket-rate-limit.guard.js.map