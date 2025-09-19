import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs-extra';
import * as path from 'path';
import { Domain } from '../entities/domain.entity';
import { ProxyRule } from '../entities/proxy-rule.entity';
import { Redirect } from '../entities/redirect.entity';
import { ConfigService } from './config.service';

@Injectable()
export class ConfigGenerationService {
  constructor(
    @InjectRepository(Domain)
    private domainRepository: Repository<Domain>,
    private configService: ConfigService,
  ) {}

  async generateNginxConfig(): Promise<void> {
    const domains = await this.domainRepository.find({
      where: { isActive: true },
      relations: ['proxyRules', 'redirects'],
    });

    const nginxConfigPath = this.configService.nginxConfigPath;
    await fs.ensureDir(nginxConfigPath);

    for (const domain of domains) {
      const config = this.generateNginxVirtualHost(domain);
      const configFile = path.join(nginxConfigPath, `${domain.name}.conf`);
      await fs.writeFile(configFile, config);
    }

    await this.reloadNginx();
  }

  private generateNginxVirtualHost(domain: Domain): string {
    const activeProxyRules = domain.proxyRules
      ?.filter(rule => rule.isActive)
      .sort((a, b) => b.priority - a.priority) || [];

    const activeRedirects = domain.redirects
      ?.filter(redirect => redirect.isActive)
      .sort((a, b) => b.priority - a.priority) || [];

    let config = `# Generated configuration for ${domain.name}\n`;

    if (domain.forceHttps) {
      config += `
server {
    listen 80;
    server_name ${domain.name};
    return 301 https://$server_name$request_uri;
}
`;
    }

    config += `
server {
    listen ${domain.forceHttps ? '443 ssl http2' : '80'};
    server_name ${domain.name};

    ${domain.blockExternalAccess ? `
    allow 127.0.0.1;
    allow 10.0.0.0/8;
    allow 172.16.0.0/12;
    allow 192.168.0.0/16;
    deny all;
    ` : ''}

    ${domain.forceHttps ? `
    ssl_certificate /etc/ssl/certs/${domain.name}.crt;
    ssl_certificate_key /etc/ssl/private/${domain.name}.key;
    ` : ''}
`;

    // Add redirects
    for (const redirect of activeRedirects) {
      config += `
    location ${redirect.sourcePattern} {
        return ${redirect.type} ${redirect.targetUrl};
    }
`;
    }

    // Add proxy rules
    for (const rule of activeProxyRules) {
      config += `
    location ${rule.sourcePath} {
        proxy_pass ${rule.targetUrl};
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        ${rule.maintainQueryStrings ? '' : 'proxy_set_header X-Original-URI $request_uri;'}
    }
`;
    }

    config += `
}
`;

    return config;
  }

  async generateTraefikConfig(): Promise<void> {
    const domains = await this.domainRepository.find({
      where: { isActive: true },
      relations: ['proxyRules', 'redirects'],
    });

    const traefikConfigPath = this.configService.traefikConfigPath;
    await fs.ensureDir(traefikConfigPath);

    const config = {
      http: {
        routers: {},
        services: {},
        middlewares: {},
      },
    };

    for (const domain of domains) {
      this.addTraefikDomainConfig(config, domain);
    }

    const configFile = path.join(traefikConfigPath, 'dynamic.yml');
    await fs.writeFile(configFile, this.yamlStringify(config));
  }

  private addTraefikDomainConfig(config: any, domain: Domain): void {
    const routerName = domain.name.replace(/\./g, '-');
    const isNetpilotDomain = domain.name === 'netpilot.meadadigital.com';

    // Special case for NetPilot domain - always ensure API + Frontend routing
    if (isNetpilotDomain) {
      this.addNetpilotDomainRouting(config, domain, routerName);
      return;
    }

    // Regular domain handling - create routers for each proxy rule
    const activeProxyRules = domain.proxyRules
      ?.filter(rule => rule.isActive)
      .sort((a, b) => b.priority - a.priority) || [];

    if (activeProxyRules.length > 0) {
      for (let i = 0; i < activeProxyRules.length; i++) {
        const rule = activeProxyRules[i];

        // Create unique router names based on path
        let currentRouterName = routerName;
        if (rule.sourcePath.startsWith('/api')) {
          currentRouterName = `${routerName}-api`;
        } else if (rule.sourcePath !== '/') {
          currentRouterName = `${routerName}-${rule.sourcePath.replace(/[^a-zA-Z0-9]/g, '-').replace(/^-+|-+$/g, '')}`;
        }

        // Create router rule with proper path matching
        let routerRule = `Host(\`${domain.name}\`)`;
        if (rule.sourcePath !== '/') {
          const pathPattern = rule.sourcePath.replace('/*', '');
          routerRule += ` && PathPrefix(\`${pathPattern}\`)`;
        }

        config.http.routers[currentRouterName] = {
          rule: routerRule,
          service: `${currentRouterName}-service`,
          middlewares: [],
          priority: rule.priority,
        };

        if (domain.autoTls) {
          config.http.routers[currentRouterName].tls = {
            certResolver: 'letsencrypt',
          };
        }

        // Create service for each proxy rule
        config.http.services[`${currentRouterName}-service`] = {
          loadBalancer: {
            servers: [{ url: rule.targetUrl }],
          },
        };
      }
    }

    // Add HTTPS redirect if force HTTPS is enabled
    if (domain.forceHttps) {
      config.http.routers[`${routerName}-redirect`] = {
        rule: `Host(\`${domain.name}\`)`,
        middlewares: [`${routerName}-redirect-https`],
        entryPoints: ['web'],
      };

      config.http.middlewares[`${routerName}-redirect-https`] = {
        redirectScheme: {
          scheme: 'https',
          permanent: true,
        },
      };
    }
  }

  private addNetpilotDomainRouting(config: any, domain: Domain, routerName: string): void {
    // Always ensure API routing for NetPilot domain
    config.http.routers[`${routerName}-api`] = {
      rule: `Host(\`${domain.name}\`) && PathPrefix(\`/api\`)`,
      service: `${routerName}-api-service`,
      middlewares: [],
      priority: 10,
      tls: {
        certResolver: 'letsencrypt',
      },
    };

    config.http.services[`${routerName}-api-service`] = {
      loadBalancer: {
        servers: [{ url: 'http://backend:3001' }],
      },
    };

    // Always ensure Frontend routing for NetPilot domain
    config.http.routers[routerName] = {
      rule: `Host(\`${domain.name}\`)`,
      service: `${routerName}-service`,
      middlewares: [],
      priority: 1,
      tls: {
        certResolver: 'letsencrypt',
      },
    };

    config.http.services[`${routerName}-service`] = {
      loadBalancer: {
        servers: [{ url: 'http://frontend:3000' }],
      },
    };

    // Always add HTTPS redirect for NetPilot domain
    config.http.routers[`${routerName}-redirect`] = {
      rule: `Host(\`${domain.name}\`)`,
      middlewares: [`${routerName}-redirect-https`],
      entryPoints: ['web'],
    };

    config.http.middlewares[`${routerName}-redirect-https`] = {
      redirectScheme: {
        scheme: 'https',
        permanent: true,
      },
    };
  }

  private yamlStringify(obj: any): string {
    // Simple YAML stringifier - in production, use a proper YAML library
    return JSON.stringify(obj, null, 2)
      .replace(/"/g, '')
      .replace(/,$/gm, '')
      .replace(/\{/g, '')
      .replace(/\}/g, '');
  }

  private async reloadNginx(): Promise<void> {
    // In production, this would trigger nginx reload
    console.log('🔄 Nginx configuration reloaded');
  }
}