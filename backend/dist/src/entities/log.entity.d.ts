export declare enum LogType {
    DEPLOYMENT = "deployment",
    SSL_RENEWAL = "ssl_renewal",
    NGINX_RELOAD = "nginx_reload",
    TRAEFIK_RELOAD = "traefik_reload",
    SYSTEM = "system"
}
export declare enum LogStatus {
    SUCCESS = "success",
    FAILED = "failed",
    RUNNING = "running",
    PENDING = "pending"
}
export declare class Log {
    id: string;
    type: LogType;
    status: LogStatus;
    action: string;
    message: string;
    details: string;
    duration: number;
    startedAt: Date;
    completedAt: Date;
    createdAt: Date;
}
