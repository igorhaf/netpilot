export interface WebSocketConfig {
    cors: {
        origins: string[];
        credentials: boolean;
    };
    rateLimit: {
        connection: {
            windowMs: number;
            maxRequests: number;
        };
        command: {
            windowMs: number;
            maxRequests: number;
        };
        moderate: {
            windowMs: number;
            maxRequests: number;
        };
        light: {
            windowMs: number;
            maxRequests: number;
        };
    };
    auth: {
        required: boolean;
        jwtSecret: string;
    };
    cleanup: {
        intervalMs: number;
        timeoutMs: number;
    };
}
export declare const getWebSocketConfig: () => WebSocketConfig;
export declare const websocketConfig: WebSocketConfig;
