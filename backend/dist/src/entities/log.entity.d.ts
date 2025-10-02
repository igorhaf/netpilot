export declare enum LogType {
    DEPLOYMENT = "deployment",
    SSL_RENEWAL = "ssl_renewal",
    SSL_GENERATION = "ssl_generation",
    NGINX_RELOAD = "nginx_reload",
    TRAEFIK_RELOAD = "traefik_reload",
    SYSTEM = "system",
    PROJECT = "project",
    DOMAIN = "domain",
    PROXY_RULE = "proxy_rule",
    REDIRECT = "redirect",
    DOCKER = "docker",
    QUEUE = "queue"
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
