"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.websocketConfig = exports.getWebSocketConfig = void 0;
const getWebSocketConfig = () => ({
    cors: {
        origins: [
            process.env.FRONTEND_URL || 'http://localhost:3000',
            'https://netpilot.meadadigital.com',
            'https://netpilot.meadadigital.com:3000',
            'http://netpilot.meadadigital.com',
            'http://netpilot.meadadigital.com:3000',
            'http://localhost:3000',
            'http://meadadigital.com:3000',
            ...(process.env.WEBSOCKET_ADDITIONAL_ORIGINS?.split(',') || [])
        ],
        credentials: true
    },
    rateLimit: {
        connection: {
            windowMs: parseInt(process.env.WEBSOCKET_CONNECTION_RATE_WINDOW_MS || '60000'),
            maxRequests: parseInt(process.env.WEBSOCKET_CONNECTION_RATE_MAX || '3')
        },
        command: {
            windowMs: parseInt(process.env.WEBSOCKET_COMMAND_RATE_WINDOW_MS || '10000'),
            maxRequests: parseInt(process.env.WEBSOCKET_COMMAND_RATE_MAX || '10')
        },
        moderate: {
            windowMs: parseInt(process.env.WEBSOCKET_MODERATE_RATE_WINDOW_MS || '60000'),
            maxRequests: parseInt(process.env.WEBSOCKET_MODERATE_RATE_MAX || '20')
        },
        light: {
            windowMs: parseInt(process.env.WEBSOCKET_LIGHT_RATE_WINDOW_MS || '60000'),
            maxRequests: parseInt(process.env.WEBSOCKET_LIGHT_RATE_MAX || '60')
        }
    },
    auth: {
        required: process.env.WEBSOCKET_AUTH_REQUIRED !== 'false',
        jwtSecret: process.env.JWT_SECRET || 'default-secret'
    },
    cleanup: {
        intervalMs: parseInt(process.env.WEBSOCKET_CLEANUP_INTERVAL_MS || '300000'),
        timeoutMs: parseInt(process.env.WEBSOCKET_CONNECTION_TIMEOUT_MS || '1800000')
    }
});
exports.getWebSocketConfig = getWebSocketConfig;
exports.websocketConfig = (0, exports.getWebSocketConfig)();
//# sourceMappingURL=websocket.config.js.map