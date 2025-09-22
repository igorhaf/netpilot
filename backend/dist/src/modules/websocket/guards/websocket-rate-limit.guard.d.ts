import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Cache } from '@nestjs/cache-manager';
export declare const RATE_LIMIT_KEY = "rate_limit";
export interface RateLimitOptions {
    windowMs: number;
    maxRequests: number;
    skipSuccessfulRequests?: boolean;
    skipFailedRequests?: boolean;
}
export declare const RateLimit: (options: RateLimitOptions) => (target: any, propertyName: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
export declare class WebSocketRateLimitGuard implements CanActivate {
    private reflector;
    private cacheManager;
    private readonly logger;
    constructor(reflector: Reflector, cacheManager: Cache);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
export declare const LightRateLimit: () => (target: any, propertyName: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
export declare const ModerateRateLimit: () => (target: any, propertyName: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
export declare const StrictRateLimit: () => (target: any, propertyName: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
export declare const CommandRateLimit: () => (target: any, propertyName: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
export declare const ConnectionRateLimit: () => (target: any, propertyName: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
