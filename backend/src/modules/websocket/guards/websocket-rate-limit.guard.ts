import { Injectable, CanActivate, ExecutionContext, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';

export const RATE_LIMIT_KEY = 'rate_limit';

export interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

export const RateLimit = (options: RateLimitOptions) => {
  return (target: any, propertyName: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata(RATE_LIMIT_KEY, options, descriptor.value);
    return descriptor;
  };
};

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

@Injectable()
export class WebSocketRateLimitGuard implements CanActivate {
  private readonly logger = new Logger(WebSocketRateLimitGuard.name);

  constructor(
    private reflector: Reflector,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const rateLimitOptions = this.reflector.get<RateLimitOptions>(
      RATE_LIMIT_KEY,
      context.getHandler()
    );

    if (!rateLimitOptions) {
      return true; // No rate limit configured
    }

    const client = context.switchToWs().getClient<AuthenticatedSocket>();
    const data = context.switchToWs().getData();

    if (!client.userId) {
      // Allow unauthenticated requests to fail at auth level
      return true;
    }

    const key = `rate_limit:${client.userId}:${context.getHandler().name}`;
    const windowStart = Math.floor(Date.now() / rateLimitOptions.windowMs) * rateLimitOptions.windowMs;
    const windowKey = `${key}:${windowStart}`;

    try {
      const currentCount = await this.cacheManager.get<number>(windowKey) || 0;

      if (currentCount >= rateLimitOptions.maxRequests) {
        this.logger.warn(
          `Rate limit exceeded for user ${client.userId} on ${context.getHandler().name}. ` +
          `${currentCount}/${rateLimitOptions.maxRequests} requests in ${rateLimitOptions.windowMs}ms window`
        );

        client.emit('error', {
          type: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests. Please slow down.',
          retryAfter: rateLimitOptions.windowMs - (Date.now() % rateLimitOptions.windowMs)
        });

        return false;
      }

      // Increment counter
      await this.cacheManager.set(
        windowKey,
        currentCount + 1,
        rateLimitOptions.windowMs
      );

      return true;

    } catch (error) {
      this.logger.error(`Rate limiting error for user ${client.userId}:`, error);
      // Allow request on cache errors to avoid blocking legitimate traffic
      return true;
    }
  }
}

// Predefined rate limit decorators for common use cases
export const LightRateLimit = () => RateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 60 // 60 requests per minute
});

export const ModerateRateLimit = () => RateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 20 // 20 requests per minute
});

export const StrictRateLimit = () => RateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 5 // 5 requests per minute
});

export const CommandRateLimit = () => RateLimit({
  windowMs: 10 * 1000, // 10 seconds
  maxRequests: 10 // 10 commands per 10 seconds
});

export const ConnectionRateLimit = () => RateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 3 // 3 connections per minute
});