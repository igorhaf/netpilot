import { ConfigService as NestConfigService } from '@nestjs/config';
export declare class ConfigService {
    private configService;
    constructor(configService: NestConfigService);
    get(key: string): string;
    getNumber(key: string): number;
    getBoolean(key: string): boolean;
    get jwtSecret(): string;
    get jwtExpiresIn(): string;
    get nginxConfigPath(): string;
    get traefikConfigPath(): string;
    get sslCertsPath(): string;
    get acmeEmail(): string;
    get acmeStaging(): boolean;
}
