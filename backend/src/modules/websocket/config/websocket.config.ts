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

export const getWebSocketConfig = (): WebSocketConfig => ({
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
      windowMs: parseInt(process.env.WEBSOCKET_CONNECTION_RATE_WINDOW_MS || '60000'), // 1 minute
      maxRequests: parseInt(process.env.WEBSOCKET_CONNECTION_RATE_MAX || '3') // 3 connections per minute
    },
    command: {
      windowMs: parseInt(process.env.WEBSOCKET_COMMAND_RATE_WINDOW_MS || '10000'), // 10 seconds
      maxRequests: parseInt(process.env.WEBSOCKET_COMMAND_RATE_MAX || '10') // 10 commands per 10 seconds
    },
    moderate: {
      windowMs: parseInt(process.env.WEBSOCKET_MODERATE_RATE_WINDOW_MS || '60000'), // 1 minute
      maxRequests: parseInt(process.env.WEBSOCKET_MODERATE_RATE_MAX || '20') // 20 requests per minute
    },
    light: {
      windowMs: parseInt(process.env.WEBSOCKET_LIGHT_RATE_WINDOW_MS || '60000'), // 1 minute
      maxRequests: parseInt(process.env.WEBSOCKET_LIGHT_RATE_MAX || '60') // 60 requests per minute
    }
  },
  auth: {
    required: process.env.WEBSOCKET_AUTH_REQUIRED !== 'false',
    jwtSecret: process.env.JWT_SECRET || 'default-secret'
  },
  cleanup: {
    intervalMs: parseInt(process.env.WEBSOCKET_CLEANUP_INTERVAL_MS || '300000'), // 5 minutes
    timeoutMs: parseInt(process.env.WEBSOCKET_CONNECTION_TIMEOUT_MS || '1800000') // 30 minutes
  }
});

export const websocketConfig = getWebSocketConfig();