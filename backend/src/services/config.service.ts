import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';

@Injectable()
export class ConfigService {
  constructor(private configService: NestConfigService) {}

  get(key: string): string {
    return this.configService.get<string>(key);
  }

  getNumber(key: string): number {
    return this.configService.get<number>(key);
  }

  getBoolean(key: string): boolean {
    return this.configService.get<boolean>(key);
  }

  get jwtSecret(): string {
    return this.get('JWT_SECRET') || 'netpilot_default_secret';
  }

  get jwtExpiresIn(): string {
    return this.get('JWT_EXPIRES_IN') || '7d';
  }

  get nginxConfigPath(): string {
    return this.get('NGINX_CONFIG_PATH') || './configs/nginx/sites';
  }

  get traefikConfigPath(): string {
    return this.get('TRAEFIK_CONFIG_PATH') || './configs/traefik';
  }

  get sslCertsPath(): string {
    return this.get('SSL_CERTS_PATH') || './configs/ssl';
  }

  get acmeEmail(): string {
    return this.get('ACME_EMAIL') || 'admin@netpilot.local';
  }

  get acmeStaging(): boolean {
    return this.getBoolean('ACME_STAGING') || true;
  }
}