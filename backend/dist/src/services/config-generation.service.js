"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var ConfigGenerationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigGenerationService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const axios_1 = require("@nestjs/axios");
const config_1 = require("@nestjs/config");
const rxjs_1 = require("rxjs");
const domain_entity_1 = require("../entities/domain.entity");
const config_service_1 = require("./config.service");
let ConfigGenerationService = ConfigGenerationService_1 = class ConfigGenerationService {
    constructor(domainRepository, configService, httpService, nestConfigService) {
        this.domainRepository = domainRepository;
        this.configService = configService;
        this.httpService = httpService;
        this.nestConfigService = nestConfigService;
        this.logger = new common_1.Logger(ConfigGenerationService_1.name);
        this.systemOpsUrl = this.nestConfigService.get('SYSTEM_OPS_URL', 'http://localhost:8001');
    }
    async generateNginxConfig() {
        try {
            this.logger.log('📝 Solicitando geração de configurações Nginx ao Python service');
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(`${this.systemOpsUrl}/config/generate-nginx`));
            if (response.data.success) {
                this.logger.log(`✅ Configurações Nginx geradas: ${response.data.domains_count} domínios`);
            }
            else {
                this.logger.error('❌ Falha ao gerar configurações Nginx');
                throw new Error(response.data.message || 'Erro ao gerar configurações Nginx');
            }
        }
        catch (error) {
            this.logger.error(`❌ Erro ao comunicar com Python service: ${error.message}`);
            throw error;
        }
    }
    generateNginxVirtualHost(domain) {
        const activeProxyRules = domain.proxyRules
            ?.filter(rule => rule.isActive)
            .sort((a, b) => b.priority - a.priority) || [];
        const activeRedirects = [];
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
        for (const redirect of activeRedirects) {
            config += `
    location ${redirect.sourcePattern} {
        return ${redirect.type} ${redirect.targetUrl};
    }
`;
        }
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
    async generateTraefikConfig() {
        try {
            this.logger.log('📝 Solicitando geração de configuração Traefik ao Python service');
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(`${this.systemOpsUrl}/config/generate-traefik`));
            if (response.data.success) {
                this.logger.log(`✅ Configuração Traefik gerada: ${response.data.domains_count} domínios`);
            }
            else {
                this.logger.error('❌ Falha ao gerar configuração Traefik');
                throw new Error(response.data.message || 'Erro ao gerar configuração Traefik');
            }
        }
        catch (error) {
            this.logger.error(`❌ Erro ao comunicar com Python service: ${error.message}`);
            throw error;
        }
    }
    addTraefikDomainConfig(config, domain) {
        const routerName = domain.name.replace(/\./g, '-');
        const isNetpilotDomain = domain.name === 'netpilot.meadadigital.com';
        if (isNetpilotDomain) {
            this.addNetpilotDomainRouting(config, domain, routerName);
            return;
        }
        const activeProxyRules = domain.proxyRules
            ?.filter(rule => rule.isActive)
            .sort((a, b) => b.priority - a.priority) || [];
        if (activeProxyRules.length > 0) {
            for (let i = 0; i < activeProxyRules.length; i++) {
                const rule = activeProxyRules[i];
                let currentRouterName = routerName;
                if (rule.sourcePath.startsWith('/api')) {
                    currentRouterName = `${routerName}-api`;
                }
                else if (rule.sourcePath !== '/') {
                    currentRouterName = `${routerName}-${rule.sourcePath.replace(/[^a-zA-Z0-9]/g, '-').replace(/^-+|-+$/g, '')}`;
                }
                let routerRule = `Host(\`${domain.name}\`)`;
                if (rule.sourcePath !== '/') {
                    const pathPattern = rule.sourcePath.replace('/*', '');
                    routerRule += ` && PathPrefix(\`${pathPattern}\`)`;
                }
                const entryPoints = this.getEntryPointsForPort(rule.sourcePort, domain.autoTls);
                config.http.routers[currentRouterName] = {
                    rule: routerRule,
                    service: `${currentRouterName}-service`,
                    middlewares: [],
                    priority: rule.priority,
                    entryPoints: entryPoints,
                };
                if (domain.autoTls && entryPoints.includes('websecure')) {
                    config.http.routers[currentRouterName].tls = {
                        certResolver: 'letsencrypt',
                    };
                }
                config.http.services[`${currentRouterName}-service`] = {
                    loadBalancer: {
                        servers: [{ url: rule.targetUrl }],
                    },
                };
            }
        }
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
    addNetpilotDomainRouting(config, domain, routerName) {
        config.http.routers[`${routerName}-api`] = {
            rule: `Host(\`${domain.name}\`) && PathPrefix(\`/api\`)`,
            service: `${routerName}-api-service`,
            middlewares: [],
            priority: 10,
            entryPoints: ['websecure'],
            tls: {
                certResolver: 'letsencrypt',
            },
        };
        config.http.services[`${routerName}-api-service`] = {
            loadBalancer: {
                servers: [{ url: 'http://backend:3001' }],
            },
        };
        config.http.routers[routerName] = {
            rule: `Host(\`${domain.name}\`)`,
            service: `${routerName}-service`,
            middlewares: [],
            priority: 1,
            entryPoints: ['websecure'],
            tls: {
                certResolver: 'letsencrypt',
            },
        };
        config.http.services[`${routerName}-service`] = {
            loadBalancer: {
                servers: [{ url: 'http://frontend:3000' }],
            },
        };
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
    yamlStringify(obj) {
        return JSON.stringify(obj, null, 2)
            .replace(/"/g, '')
            .replace(/,$/gm, '')
            .replace(/\{/g, '')
            .replace(/\}/g, '');
    }
    async reloadNginx() {
        console.log('🔄 Nginx configuration reloaded');
    }
    getEntryPointsForPort(sourcePort, autoTls) {
        if (!sourcePort) {
            return autoTls ? ['websecure'] : ['web'];
        }
        switch (sourcePort) {
            case 80:
                return ['web'];
            case 443:
                return ['websecure'];
            default:
                return [`port${sourcePort}`];
        }
    }
};
exports.ConfigGenerationService = ConfigGenerationService;
exports.ConfigGenerationService = ConfigGenerationService = ConfigGenerationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(domain_entity_1.Domain)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        config_service_1.ConfigService,
        axios_1.HttpService,
        config_1.ConfigService])
], ConfigGenerationService);
//# sourceMappingURL=config-generation.service.js.map