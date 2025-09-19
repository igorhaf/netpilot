# Traefik Documentation - NetPilot

## Visão Geral

O Traefik atua como o load balancer e proxy reverso principal do NetPilot, fornecendo terminação SSL automática, descoberta de serviços e roteamento dinâmico baseado em labels Docker.

## Arquitetura do Traefik

### Fluxo de Tráfego
```
Internet
    │
    ▼
┌─────────────────┐
│   Traefik       │ :80, :443, :8080
│ (Edge Router)   │
└─────────┬───────┘
          │
    ┌─────┴─────┐
    │  Routers  │ (HTTP/HTTPS rules)
    └─────┬─────┘
          │
    ┌─────┴─────┐
    │Middlewares│ (Auth, Rate Limit, Headers)
    └─────┬─────┘
          │
    ┌─────┴─────┐
    │ Services  │ (Load Balancing)
    └─────┬─────┘
          │
    ┌─────┴─────┐
    │Providers  │ (Docker, File)
    └───────────┘
          │
    ┌─────┴─────┐
    │ Backend   │ (Actual Services)
    │ Services  │
    └───────────┘
```

## Configuração Principal

### traefik.yml
```yaml
# Static Configuration
global:
  checkNewVersion: false
  sendAnonymousUsage: false

# Entry Points
entryPoints:
  web:
    address: ":80"
    http:
      redirections:
        entrypoint:
          to: websecure
          scheme: https
          permanent: true

  websecure:
    address: ":443"
    http:
      middlewares:
        - security-headers@file
        - rate-limit@file

  traefik:
    address: ":8080"

# Providers
providers:
  docker:
    endpoint: "unix:///var/run/docker.sock"
    exposedByDefault: false
    network: netpilot-public
    watch: true

  file:
    directory: /etc/traefik/dynamic
    watch: true

# Certificate Resolvers
certificatesResolvers:
  letsencrypt:
    acme:
      email: admin@netpilot.local
      storage: /etc/traefik/acme/acme.json
      httpChallenge:
        entryPoint: web
      # For production
      # caServer: https://acme-v02.api.letsencrypt.org/directory
      # For staging/testing
      caServer: https://acme-staging-v02.api.letsencrypt.org/directory

  letsencrypt-dns:
    acme:
      email: admin@netpilot.local
      storage: /etc/traefik/acme/acme-dns.json
      dnsChallenge:
        provider: cloudflare
        resolvers:
          - "1.1.1.1:53"
          - "8.8.8.8:53"
        delayBeforeCheck: 30s

# API and Dashboard
api:
  dashboard: true
  debug: true
  insecure: true # Only for development

# Logging
log:
  level: INFO
  format: json

accessLog:
  format: json
  filters:
    statusCodes:
      - "400-499"
      - "500-599"

# Metrics
metrics:
  prometheus:
    addEntryPointsLabels: true
    addServicesLabels: true
    buckets:
      - 0.1
      - 0.3
      - 1.2
      - 5.0

# Ping
ping:
  entryPoint: traefik

# Tracing
tracing:
  jaeger:
    samplingServerURL: http://jaeger:14268/api/sampling
    localAgentHostPort: jaeger:6831
```

### Configuração Dinâmica

#### dynamic/middlewares.yml
```yaml
http:
  middlewares:
    # Security Headers
    security-headers:
      headers:
        customRequestHeaders:
          X-Forwarded-Proto: "https"
        customResponseHeaders:
          X-Frame-Options: "SAMEORIGIN"
          X-Content-Type-Options: "nosniff"
          X-XSS-Protection: "1; mode=block"
          Referrer-Policy: "strict-origin-when-cross-origin"
          Permissions-Policy: "geolocation=(), microphone=(), camera=()"
          Strict-Transport-Security: "max-age=31536000; includeSubDomains; preload"
        contentSecurityPolicy: |
          default-src 'self';
          script-src 'self' 'unsafe-inline' 'unsafe-eval';
          style-src 'self' 'unsafe-inline';
          img-src 'self' data: https:;
          connect-src 'self' wss: ws:;
          font-src 'self';
          object-src 'none';
          media-src 'self';
          frame-src 'none';

    # Rate Limiting
    rate-limit:
      rateLimit:
        burst: 100
        period: 1m

    # Rate Limiting for API
    api-rate-limit:
      rateLimit:
        burst: 50
        period: 1m

    # Rate Limiting for Auth
    auth-rate-limit:
      rateLimit:
        burst: 10
        period: 5m

    # Authentication
    basic-auth:
      basicAuth:
        users:
          - "admin:$2y$10$hashaqui"

    # IP Whitelist
    ip-whitelist:
      ipWhiteList:
        sourceRange:
          - "127.0.0.1/32"
          - "10.0.0.0/8"
          - "172.16.0.0/12"
          - "192.168.0.0/16"

    # Redirect to HTTPS
    https-redirect:
      redirectScheme:
        scheme: https
        permanent: true

    # Strip prefix
    strip-prefix:
      stripPrefix:
        prefixes:
          - "/api"

    # Add prefix
    add-prefix:
      addPrefix:
        prefix: "/api"

    # Compress
    compress:
      compress: {}

    # CORS
    cors:
      headers:
        accessControlAllowMethods:
          - GET
          - POST
          - PUT
          - DELETE
          - OPTIONS
        accessControlAllowOriginList:
          - "https://netpilot.local"
          - "https://app.netpilot.local"
        accessControlAllowHeaders:
          - "Content-Type"
          - "Authorization"
          - "X-Requested-With"
        accessControlMaxAge: 86400

    # Circuit Breaker
    circuit-breaker:
      circuitBreaker:
        expression: "NetworkErrorRatio() > 0.3 || ResponseCodeRatio(500, 600, 0, 600) > 0.3"
        checkPeriod: 10s
        fallbackDuration: 30s
        recoveryDuration: 10s

    # Retry
    retry:
      retry:
        attempts: 3
        initialInterval: 100ms

tcp:
  middlewares:
    # TCP IP Whitelist
    tcp-ip-whitelist:
      ipWhiteList:
        sourceRange:
          - "127.0.0.1/32"
          - "10.0.0.0/8"
```

#### dynamic/tls.yml
```yaml
tls:
  options:
    default:
      minVersion: "VersionTLS12"
      maxVersion: "VersionTLS13"
      cipherSuites:
        - "TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384"
        - "TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305"
        - "TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256"
        - "TLS_RSA_WITH_AES_256_GCM_SHA384"
        - "TLS_RSA_WITH_AES_128_GCM_SHA256"
      curvePreferences:
        - "CurveP521"
        - "CurveP384"
      sniStrict: true

    modern:
      minVersion: "VersionTLS13"
      cipherSuites:
        - "TLS_AES_256_GCM_SHA384"
        - "TLS_CHACHA20_POLY1305_SHA256"
        - "TLS_AES_128_GCM_SHA256"

  stores:
    default:
      defaultCertificate:
        certFile: /etc/ssl/certs/default.crt
        keyFile: /etc/ssl/certs/default.key

  certificates:
    - certFile: /etc/ssl/certs/netpilot.local.crt
      keyFile: /etc/ssl/certs/netpilot.local.key
      stores:
        - default
```

#### dynamic/services.yml
```yaml
http:
  services:
    # NetPilot Backend API
    netpilot-backend:
      loadBalancer:
        servers:
          - url: "http://backend:3001"
        healthCheck:
          path: "/health"
          interval: 30s
          timeout: 10s
          scheme: http

    # NetPilot Frontend
    netpilot-frontend:
      loadBalancer:
        servers:
          - url: "http://frontend:3000"
        healthCheck:
          path: "/api/health"
          interval: 30s
          timeout: 10s

    # Multiple backend instances (for load balancing)
    backend-cluster:
      loadBalancer:
        servers:
          - url: "http://backend-1:3001"
          - url: "http://backend-2:3001"
          - url: "http://backend-3:3001"
        healthCheck:
          path: "/health"
          interval: 30s
          timeout: 10s
        sticky:
          cookie:
            name: "server-id"
            secure: true
            httpOnly: true

  routers:
    # API Routes
    api:
      rule: "Host(`netpilot.local`) && PathPrefix(`/api`)"
      service: netpilot-backend
      middlewares:
        - security-headers
        - api-rate-limit
        - strip-prefix
        - cors
      tls:
        certResolver: letsencrypt

    # Frontend Routes
    frontend:
      rule: "Host(`netpilot.local`)"
      service: netpilot-frontend
      middlewares:
        - security-headers
        - rate-limit
        - compress
      tls:
        certResolver: letsencrypt

    # Dashboard (Admin only)
    dashboard:
      rule: "Host(`admin.netpilot.local`)"
      service: api@internal
      middlewares:
        - basic-auth
        - ip-whitelist
      tls:
        certResolver: letsencrypt

    # WebSocket support
    websocket:
      rule: "Host(`ws.netpilot.local`)"
      service: netpilot-backend
      middlewares:
        - security-headers
      tls:
        certResolver: letsencrypt

tcp:
  services:
    # TCP service example (for database proxy)
    postgres-proxy:
      loadBalancer:
        servers:
          - address: "db:5432"

  routers:
    postgres:
      rule: "HostSNI(`db.netpilot.local`)"
      service: postgres-proxy
      middlewares:
        - tcp-ip-whitelist
      tls:
        passthrough: true
```

## Labels Docker para Auto-Discovery

### Backend Service Labels
```yaml
# docker-compose.yml
services:
  backend:
    image: netpilot-backend
    labels:
      # Enable Traefik
      - "traefik.enable=true"

      # HTTP Router
      - "traefik.http.routers.backend.rule=Host(`api.netpilot.local`) || (Host(`netpilot.local`) && PathPrefix(`/api`))"
      - "traefik.http.routers.backend.entrypoints=websecure"
      - "traefik.http.routers.backend.tls=true"
      - "traefik.http.routers.backend.tls.certresolver=letsencrypt"

      # Service
      - "traefik.http.services.backend.loadbalancer.server.port=3001"
      - "traefik.http.services.backend.loadbalancer.healthcheck.path=/health"
      - "traefik.http.services.backend.loadbalancer.healthcheck.interval=30s"

      # Middlewares
      - "traefik.http.routers.backend.middlewares=api-auth,api-rate-limit,strip-prefix"

      # Strip /api prefix
      - "traefik.http.middlewares.strip-prefix.stripprefix.prefixes=/api"

      # Rate limiting for API
      - "traefik.http.middlewares.api-rate-limit.ratelimit.burst=50"
      - "traefik.http.middlewares.api-rate-limit.ratelimit.period=1m"

      # Auth middleware
      - "traefik.http.middlewares.api-auth.basicauth.users=admin:$$2y$$10$$hashaqui"
```

### Frontend Service Labels
```yaml
  frontend:
    image: netpilot-frontend
    labels:
      - "traefik.enable=true"

      # HTTP Router
      - "traefik.http.routers.frontend.rule=Host(`netpilot.local`)"
      - "traefik.http.routers.frontend.entrypoints=websecure"
      - "traefik.http.routers.frontend.tls=true"
      - "traefik.http.routers.frontend.tls.certresolver=letsencrypt"

      # Service
      - "traefik.http.services.frontend.loadbalancer.server.port=3000"

      # Middlewares
      - "traefik.http.routers.frontend.middlewares=security-headers,compress"
```

## Geração Dinâmica de Configurações

### Service de Configuração (Backend)
```typescript
@Injectable()
export class TraefikConfigService {
  private readonly configPath = '/etc/traefik/dynamic';

  async generateDomainRoutes(domain: Domain): Promise<void> {
    const proxyRules = await this.getProxyRules(domain.id);
    const redirects = await this.getRedirects(domain.id);

    const config = {
      http: {
        routers: {},
        services: {},
        middlewares: {}
      }
    };

    // Generate routers for proxy rules
    for (const rule of proxyRules) {
      const routerName = `${domain.name}-${rule.id}`;
      const serviceName = `${domain.name}-${rule.id}-service`;

      config.http.routers[routerName] = {
        rule: `Host(\`${domain.name}\`) && PathPrefix(\`${rule.originPath}\`)`,
        service: serviceName,
        middlewares: [
          'security-headers',
          'rate-limit',
          ...(rule.authRequired ? ['basic-auth'] : [])
        ],
        tls: {
          certResolver: 'letsencrypt'
        },
        priority: rule.priority
      };

      config.http.services[serviceName] = {
        loadBalancer: {
          servers: [
            { url: rule.destinationUrl }
          ],
          healthCheck: {
            path: '/health',
            interval: '30s',
            timeout: '10s'
          }
        }
      };
    }

    // Generate routers for redirects
    for (const redirect of redirects) {
      const routerName = `${domain.name}-redirect-${redirect.id}`;

      config.http.routers[routerName] = {
        rule: `Host(\`${domain.name}\`) && PathPrefix(\`${redirect.originPath}\`)`,
        middlewares: [`redirect-${redirect.id}`],
        tls: {
          certResolver: 'letsencrypt'
        }
      };

      config.http.middlewares[`redirect-${redirect.id}`] = {
        redirectRegex: {
          regex: `^(.*)${redirect.originPath}(.*)$`,
          replacement: redirect.destinationUrl,
          permanent: redirect.redirectType === 301
        }
      };
    }

    const configFile = `${this.configPath}/${domain.name}.yml`;
    await fs.writeFile(configFile, yaml.dump(config));

    this.logger.log(`Generated Traefik config for domain: ${domain.name}`);
  }

  async removeDomainRoutes(domainName: string): Promise<void> {
    const configFile = `${this.configPath}/${domainName}.yml`;

    if (await fs.pathExists(configFile)) {
      await fs.unlink(configFile);
      this.logger.log(`Removed Traefik config for domain: ${domainName}`);
    }
  }

  async generateSSLConfig(certificate: SslCertificate): Promise<void> {
    const tlsConfig = {
      tls: {
        certificates: [
          {
            certFile: certificate.certificatePath,
            keyFile: certificate.privateKeyPath,
            stores: ['default']
          }
        ]
      }
    };

    const configFile = `${this.configPath}/ssl-${certificate.domainName}.yml`;
    await fs.writeFile(configFile, yaml.dump(tlsConfig));
  }
}
```

## Monitoramento e Métricas

### Prometheus Metrics
```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'traefik'
    static_configs:
      - targets: ['traefik:8080']
    metrics_path: /metrics
    scrape_interval: 15s

  - job_name: 'netpilot-backend'
    static_configs:
      - targets: ['backend:3001']
    metrics_path: /metrics
```

### Grafana Dashboard
```json
{
  "dashboard": {
    "title": "Traefik NetPilot Dashboard",
    "panels": [
      {
        "title": "Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(traefik_entrypoint_requests_total[5m])",
            "legendFormat": "{{entrypoint}}"
          }
        ]
      },
      {
        "title": "Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(traefik_entrypoint_request_duration_seconds_bucket[5m]))",
            "legendFormat": "95th percentile"
          }
        ]
      },
      {
        "title": "Error Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(traefik_entrypoint_requests_total{code=~\"4..|5..\"}[5m]) / rate(traefik_entrypoint_requests_total[5m])",
            "legendFormat": "Error Rate"
          }
        ]
      }
    ]
  }
}
```

### Health Checks
```bash
#!/bin/bash
# scripts/traefik-health.sh

# Check Traefik API
curl -f http://meadadigital.com:8080/ping || echo "Traefik API down"

# Check certificate expiry
curl -s http://meadadigital.com:8080/api/http/certificates | jq '.[] | select(.notAfter < (now + 86400*30))'

# Check service health
curl -s http://meadadigital.com:8080/api/http/services | jq '.[] | select(.serverStatus != null) | select(.serverStatus[] | .status != "UP")'

# Check router rules
curl -s http://meadadigital.com:8080/api/http/routers | jq '.[] | {name: .name, rule: .rule, status: .status}'
```

## Debugging e Troubleshooting

### Debug Configuration
```yaml
# Enable debug mode
log:
  level: DEBUG

# Enable access logs
accessLog:
  format: json
  bufferingSize: 100

# Enable API debug
api:
  debug: true
```

### Common Issues

#### Certificate Issues
```bash
# Check ACME logs
docker-compose logs traefik | grep -i acme

# Verify certificate
openssl s_client -connect domain.com:443 -servername domain.com

# Force certificate renewal
docker-compose exec traefik rm /etc/traefik/acme/acme.json
docker-compose restart traefik
```

#### Routing Issues
```bash
# Check router configuration
curl http://meadadigital.com:8080/api/http/routers

# Check service status
curl http://meadadigital.com:8080/api/http/services

# Test routing
curl -H "Host: example.com" http://meadadigital.com/api/health
```

#### Performance Issues
```bash
# Check metrics
curl http://meadadigital.com:8080/metrics

# Monitor resource usage
docker stats traefik

# Check error logs
docker-compose logs traefik | grep -i error
```

### Traefik Commands
```bash
# Validate configuration
traefik --configfile=/etc/traefik/traefik.yml --debug --dry-run

# Get version info
traefik version

# Health check
traefik healthcheck --configfile=/etc/traefik/traefik.yml
```

## Load Balancing Strategies

### Round Robin (Default)
```yaml
services:
  my-service:
    loadBalancer:
      servers:
        - url: "http://server1:80"
        - url: "http://server2:80"
        - url: "http://server3:80"
```

### Weighted Round Robin
```yaml
services:
  weighted-service:
    loadBalancer:
      servers:
        - url: "http://server1:80"
          weight: 3
        - url: "http://server2:80"
          weight: 1
```

### Sticky Sessions
```yaml
services:
  sticky-service:
    loadBalancer:
      servers:
        - url: "http://server1:80"
        - url: "http://server2:80"
      sticky:
        cookie:
          name: "server-id"
          secure: true
          httpOnly: true
          sameSite: "strict"
```

## Security Best Practices

### Production Configuration
```yaml
# Disable insecure API
api:
  dashboard: true
  insecure: false

# Use secure headers
middlewares:
  security-headers:
    headers:
      sslRedirect: true
      stsSeconds: 31536000
      stsIncludeSubdomains: true
      stsPreload: true
      forceSTSHeader: true
```

### Rate Limiting
```yaml
middlewares:
  auth-rate-limit:
    rateLimit:
      extractorFunc: "client.ip"
      burst: 5
      period: "1m"

  api-rate-limit:
    rateLimit:
      extractorFunc: "request.header.x-api-key"
      burst: 100
      period: "1m"
```

---

**Nota**: Sempre monitore os logs do Traefik para identificar problemas de configuração e performance. Use o dashboard apenas em desenvolvimento ou com autenticação adequada em produção.