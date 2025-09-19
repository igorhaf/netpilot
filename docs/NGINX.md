# Nginx Documentation - NetPilot

## Visão Geral

O Nginx no NetPilot atua como servidor web secundário e proxy reverso configurável, gerando configurações dinâmicas baseadas nas regras definidas pela interface web.

## Arquitetura do Nginx

### Estrutura de Configuração
```
configs/nginx/
├── nginx.conf                    # Configuração principal
├── sites-available/               # Sites disponíveis
│   ├── default.conf              # Site padrão
│   ├── example.com.conf          # Configurações geradas
│   └── api.netpilot.conf         # API interna
├── sites-enabled/                # Sites ativos (symlinks)
├── conf.d/                       # Configurações modulares
│   ├── ssl.conf                  # Configurações SSL
│   ├── security.conf             # Headers de segurança
│   ├── gzip.conf                 # Compressão
│   └── rate-limit.conf           # Rate limiting
├── templates/                    # Templates de configuração
│   ├── proxy-rule.template       # Template para proxy rules
│   ├── redirect.template         # Template para redirects
│   └── ssl-domain.template       # Template para SSL
└── ssl/                          # Certificados SSL
    ├── certificates/             # Certificados públicos
    ├── private/                  # Chaves privadas
    └── ca-certificates/          # CAs confiáveis
```

## Configuração Principal

### nginx.conf
```nginx
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

# Otimizações de performance
worker_rlimit_nofile 65535;

events {
    worker_connections 4096;
    use epoll;
    multi_accept on;
}

http {
    # MIME types
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging format
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for" '
                    'rt=$request_time uct="$upstream_connect_time" '
                    'uht="$upstream_header_time" urt="$upstream_response_time"';

    log_format json escape=json '{'
        '"timestamp":"$time_iso8601",'
        '"remote_addr":"$remote_addr",'
        '"request_method":"$request_method",'
        '"request_uri":"$request_uri",'
        '"status":$status,'
        '"body_bytes_sent":$body_bytes_sent,'
        '"http_referer":"$http_referer",'
        '"http_user_agent":"$http_user_agent",'
        '"request_time":$request_time,'
        '"upstream_response_time":"$upstream_response_time",'
        '"upstream_addr":"$upstream_addr"'
    '}';

    access_log /var/log/nginx/access.log main;

    # Performance settings
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    server_tokens off;

    # Buffer settings
    client_body_buffer_size 128k;
    client_max_body_size 10m;
    client_header_buffer_size 1k;
    large_client_header_buffers 4 4k;
    output_buffers 1 32k;
    postpone_output 1460;

    # Timeout settings
    client_body_timeout 30s;
    client_header_timeout 30s;
    send_timeout 30s;

    # Gzip compression
    include /etc/nginx/conf.d/gzip.conf;

    # Security headers
    include /etc/nginx/conf.d/security.conf;

    # SSL configuration
    include /etc/nginx/conf.d/ssl.conf;

    # Rate limiting
    include /etc/nginx/conf.d/rate-limit.conf;

    # Virtual hosts
    include /etc/nginx/sites-enabled/*;
}
```

### Configurações Modulares

#### conf.d/ssl.conf
```nginx
# SSL/TLS Configuration

# SSL protocols
ssl_protocols TLSv1.2 TLSv1.3;

# SSL ciphers
ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;

ssl_prefer_server_ciphers off;

# SSL session settings
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 10m;
ssl_session_tickets off;

# OCSP stapling
ssl_stapling on;
ssl_stapling_verify on;
ssl_trusted_certificate /etc/nginx/ssl/ca-certificates/chain.pem;

# DNS resolver (Google DNS)
resolver 8.8.8.8 8.8.4.4 valid=300s;
resolver_timeout 5s;

# DH parameters
ssl_dhparam /etc/nginx/ssl/dhparam.pem;

# HSTS
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
```

#### conf.d/security.conf
```nginx
# Security Headers Configuration

# Hide server information
server_tokens off;
more_clear_headers Server;

# X-Frame-Options
add_header X-Frame-Options "SAMEORIGIN" always;

# X-Content-Type-Options
add_header X-Content-Type-Options "nosniff" always;

# X-XSS-Protection
add_header X-XSS-Protection "1; mode=block" always;

# Referrer Policy
add_header Referrer-Policy "strict-origin-when-cross-origin" always;

# Permissions Policy
add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;

# Content Security Policy (customizable)
# add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;" always;

# Block common attack patterns
location ~* /(wp-admin|wp-login|admin|phpmyadmin|\.git|\.env|\.htaccess) {
    deny all;
    return 404;
}

# Block suspicious file extensions
location ~* \.(php|php3|php4|php5|phtml|pl|py|jsp|asp|sh|cgi)$ {
    deny all;
    return 404;
}

# Block access to hidden files
location ~ /\. {
    deny all;
    access_log off;
    log_not_found off;
}
```

#### conf.d/gzip.conf
```nginx
# Gzip Compression Configuration

gzip on;
gzip_vary on;
gzip_min_length 1000;
gzip_proxied any;
gzip_comp_level 6;
gzip_types
    application/atom+xml
    application/javascript
    application/json
    application/ld+json
    application/manifest+json
    application/rss+xml
    application/vnd.geo+json
    application/vnd.ms-fontobject
    application/x-font-ttf
    application/x-web-app-manifest+json
    application/xhtml+xml
    application/xml
    font/opentype
    image/bmp
    image/svg+xml
    image/x-icon
    text/cache-manifest
    text/css
    text/plain
    text/vcard
    text/vnd.rim.location.xloc
    text/vtt
    text/x-component
    text/x-cross-domain-policy;

gzip_disable "msie6";
```

#### conf.d/rate-limit.conf
```nginx
# Rate Limiting Configuration

# Define rate limiting zones
limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=general:10m rate=1r/s;

# Connection limiting
limit_conn_zone $binary_remote_addr zone=addr:10m;

# Rate limiting log level
limit_req_log_level warn;
limit_conn_log_level warn;
```

## Templates de Configuração

### templates/proxy-rule.template
```nginx
# Proxy Rule Template
# Generated automatically by NetPilot
# Domain: {{DOMAIN_NAME}}
# Rule ID: {{RULE_ID}}
# Priority: {{PRIORITY}}

location {{ORIGIN_PATH}} {
    # Rate limiting
    limit_req zone=api burst=20 nodelay;
    limit_conn addr 10;

    # Proxy settings
    proxy_pass {{DESTINATION_URL}};
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Forwarded-Port $server_port;

    # Timeouts
    proxy_connect_timeout 30s;
    proxy_send_timeout 30s;
    proxy_read_timeout 30s;

    # Buffer settings
    proxy_buffering on;
    proxy_buffer_size 4k;
    proxy_buffers 8 4k;
    proxy_busy_buffers_size 8k;

    # Cache settings (if applicable)
    {{#if ENABLE_CACHE}}
    proxy_cache {{CACHE_ZONE}};
    proxy_cache_valid 200 302 10m;
    proxy_cache_valid 404 1m;
    proxy_cache_bypass $http_pragma $http_authorization;
    {{/if}}

    # Keep query strings
    {{#if KEEP_QUERY_STRINGS}}
    proxy_pass_request_body on;
    {{/if}}

    # Security headers
    proxy_hide_header X-Powered-By;
    proxy_hide_header Server;

    # Custom headers
    {{#each CUSTOM_HEADERS}}
    proxy_set_header {{name}} "{{value}}";
    {{/each}}
}
```

### templates/redirect.template
```nginx
# Redirect Template
# Generated automatically by NetPilot
# Domain: {{DOMAIN_NAME}}
# Redirect ID: {{REDIRECT_ID}}

location {{ORIGIN_PATH}} {
    # Rate limiting
    limit_req zone=general burst=10 nodelay;

    return {{REDIRECT_TYPE}} {{DESTINATION_URL}};
}
```

### templates/ssl-domain.template
```nginx
# SSL Domain Configuration
# Generated automatically by NetPilot
# Domain: {{DOMAIN_NAME}}
# Certificate: {{CERTIFICATE_PATH}}

server {
    listen 80;
    server_name {{DOMAIN_NAME}} {{#each SAN_DOMAINS}}{{this}} {{/each}};

    # Security headers
    include /etc/nginx/conf.d/security.conf;

    {{#if FORCE_HTTPS}}
    # Force HTTPS redirect
    return 301 https://$server_name$request_uri;
    {{else}}
    # HTTP configuration
    {{> proxy-rules}}
    {{> redirects}}
    {{/if}}
}

{{#if SSL_ENABLED}}
server {
    listen 443 ssl http2;
    server_name {{DOMAIN_NAME}} {{#each SAN_DOMAINS}}{{this}} {{/each}};

    # SSL certificate
    ssl_certificate {{CERTIFICATE_PATH}};
    ssl_certificate_key {{PRIVATE_KEY_PATH}};

    # Security headers
    include /etc/nginx/conf.d/security.conf;

    # SSL configuration
    include /etc/nginx/conf.d/ssl.conf;

    {{#if BLOCK_EXTERNAL}}
    # Block external access
    allow 127.0.0.1;
    allow 10.0.0.0/8;
    allow 172.16.0.0/12;
    allow 192.168.0.0/16;
    deny all;
    {{/if}}

    # Error pages
    error_page 404 /404.html;
    error_page 500 502 503 504 /50x.html;

    # Proxy rules
    {{> proxy-rules}}

    # Redirects
    {{> redirects}}

    # Default location
    location / {
        {{#if DEFAULT_BACKEND}}
        proxy_pass {{DEFAULT_BACKEND}};
        {{else}}
        return 404;
        {{/if}}
    }
}
{{/if}}
```

## Geração Dinâmica de Configurações

### Service de Geração (Backend)
```typescript
@Injectable()
export class NginxConfigService {
  private readonly templatesPath = '/app/configs/nginx/templates';
  private readonly sitesAvailablePath = '/app/configs/nginx/sites-available';
  private readonly sitesEnabledPath = '/app/configs/nginx/sites-enabled';

  async generateDomainConfig(domain: Domain): Promise<void> {
    const template = await this.loadTemplate('ssl-domain.template');
    const proxyRules = await this.getProxyRules(domain.id);
    const redirects = await this.getRedirects(domain.id);
    const sslCertificate = await this.getSSLCertificate(domain.id);

    const config = this.compileTemplate(template, {
      DOMAIN_NAME: domain.name,
      SAN_DOMAINS: sslCertificate?.sanDomains || [],
      SSL_ENABLED: sslCertificate && sslCertificate.status === 'issued',
      CERTIFICATE_PATH: sslCertificate?.certificatePath,
      PRIVATE_KEY_PATH: sslCertificate?.privateKeyPath,
      FORCE_HTTPS: domain.forceHttps,
      BLOCK_EXTERNAL: domain.blockExternal,
      WWW_REDIRECT: domain.wwwRedirect,
      proxy_rules: proxyRules,
      redirects: redirects
    });

    const configPath = `${this.sitesAvailablePath}/${domain.name}.conf`;
    await fs.writeFile(configPath, config);

    if (domain.enabled) {
      await this.enableSite(domain.name);
    } else {
      await this.disableSite(domain.name);
    }

    await this.reloadNginx();
  }

  async generateProxyRuleConfig(rule: ProxyRule): Promise<string> {
    const template = await this.loadTemplate('proxy-rule.template');

    return this.compileTemplate(template, {
      RULE_ID: rule.id,
      ORIGIN_PATH: rule.originPath,
      DESTINATION_URL: rule.destinationUrl,
      PRIORITY: rule.priority,
      KEEP_QUERY_STRINGS: rule.keepQueryStrings,
      DOMAIN_NAME: rule.domain.name,
      CUSTOM_HEADERS: rule.customHeaders || []
    });
  }

  async generateRedirectConfig(redirect: Redirect): Promise<string> {
    const template = await this.loadTemplate('redirect.template');

    return this.compileTemplate(template, {
      REDIRECT_ID: redirect.id,
      ORIGIN_PATH: redirect.originPath,
      DESTINATION_URL: redirect.destinationUrl,
      REDIRECT_TYPE: redirect.redirectType,
      DOMAIN_NAME: redirect.domain.name
    });
  }

  private async enableSite(siteName: string): Promise<void> {
    const sourcePath = `${this.sitesAvailablePath}/${siteName}.conf`;
    const targetPath = `${this.sitesEnabledPath}/${siteName}.conf`;

    if (await fs.pathExists(sourcePath)) {
      await fs.ensureSymlink(sourcePath, targetPath);
    }
  }

  private async disableSite(siteName: string): Promise<void> {
    const targetPath = `${this.sitesEnabledPath}/${siteName}.conf`;

    if (await fs.pathExists(targetPath)) {
      await fs.unlink(targetPath);
    }
  }

  private async reloadNginx(): Promise<void> {
    try {
      // Test configuration first
      const testResult = await this.execCommand('nginx -t');

      if (testResult.exitCode === 0) {
        // Reload if test passes
        await this.execCommand('nginx -s reload');
        this.logger.log('Nginx configuration reloaded successfully');
      } else {
        this.logger.error('Nginx configuration test failed', testResult.stderr);
        throw new Error('Invalid Nginx configuration');
      }
    } catch (error) {
      this.logger.error('Failed to reload Nginx', error);
      throw error;
    }
  }

  private compileTemplate(template: string, variables: any): string {
    // Simple template compilation (can use Handlebars for complex templates)
    let compiled = template;

    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      compiled = compiled.replace(regex, String(value));
    }

    return compiled;
  }
}
```

## Monitoramento e Logs

### Log Analysis
```bash
# Analisar logs de acesso
tail -f /var/log/nginx/access.log | grep -E "(4[0-9]{2}|5[0-9]{2})"

# Top IPs por requests
awk '{print $1}' /var/log/nginx/access.log | sort | uniq -c | sort -nr | head -10

# Status codes mais comuns
awk '{print $9}' /var/log/nginx/access.log | sort | uniq -c | sort -nr

# URLs mais acessadas
awk '{print $7}' /var/log/nginx/access.log | sort | uniq -c | sort -nr | head -10

# Requests por hora
awk '{print $4}' /var/log/nginx/access.log | cut -c2-14 | sort | uniq -c

# Analise de performance
awk '{print $NF}' /var/log/nginx/access.log | sort -n | tail -10
```

### Health Check Endpoint
```nginx
# sites-available/health.conf
server {
    listen 8081;
    server_name localhost;

    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }

    location /nginx_status {
        stub_status on;
        access_log off;
        allow 127.0.0.1;
        allow 172.16.0.0/12;
        deny all;
    }

    location /metrics {
        access_log off;
        allow 127.0.0.1;
        allow 172.16.0.0/12;
        deny all;

        content_by_lua_block {
            local prometheus = require "resty.prometheus"
            prometheus:collect()
        }
    }
}
```

## Performance Tuning

### Worker Processes Optimization
```nginx
# Auto-detect CPU cores
worker_processes auto;

# Increase worker connections
events {
    worker_connections 4096;
    use epoll;
    multi_accept on;
}

# File descriptor limits
worker_rlimit_nofile 65535;
```

### Buffer Optimization
```nginx
# Client buffers
client_body_buffer_size 128k;
client_max_body_size 10m;
client_header_buffer_size 1k;
large_client_header_buffers 4 4k;

# Proxy buffers
proxy_buffering on;
proxy_buffer_size 4k;
proxy_buffers 8 4k;
proxy_busy_buffers_size 8k;

# FastCGI buffers (if using PHP)
fastcgi_buffering on;
fastcgi_buffer_size 4k;
fastcgi_buffers 8 4k;
```

### Caching Configuration
```nginx
# Proxy cache
proxy_cache_path /var/cache/nginx/proxy
                 levels=1:2
                 keys_zone=proxy_cache:10m
                 max_size=1g
                 inactive=60m
                 use_temp_path=off;

# Static files cache
location ~* \.(jpg|jpeg|png|gif|ico|css|js|woff|woff2)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    add_header Vary Accept-Encoding;
    access_log off;
}

# API cache
location /api/ {
    proxy_cache proxy_cache;
    proxy_cache_valid 200 302 10m;
    proxy_cache_valid 404 1m;
    proxy_cache_bypass $http_pragma $http_authorization;
    add_header X-Cache-Status $upstream_cache_status;
}
```

## Troubleshooting

### Comandos de Diagnóstico
```bash
# Testar configuração
nginx -t

# Verificar sintaxe
nginx -T

# Status do Nginx
systemctl status nginx

# Processos do Nginx
ps aux | grep nginx

# Verificar portas
netstat -tulpn | grep nginx
ss -tulpn | grep nginx

# Verificar logs
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log
```

### Problemas Comuns

#### 502 Bad Gateway
```bash
# Verificar upstream
curl -I http://backend:3001/health

# Verificar conectividade
telnet backend 3001

# Verificar logs de erro
grep "502" /var/log/nginx/error.log

# Soluções
# 1. Verificar se backend está rodando
# 2. Verificar conectividade de rede
# 3. Ajustar timeouts
# 4. Verificar DNS resolution
```

#### 413 Request Entity Too Large
```nginx
# Aumentar limite de upload
client_max_body_size 10m;

# Para uploads grandes
client_max_body_size 100m;
client_body_timeout 120s;
```

#### SSL Certificate Issues
```bash
# Verificar certificado
openssl x509 -in /path/to/cert.pem -text -noout

# Verificar cadeia
openssl verify -CAfile /path/to/ca.pem /path/to/cert.pem

# Teste SSL
openssl s_client -connect domain.com:443 -servername domain.com
```

---

**Nota**: Sempre teste as configurações com `nginx -t` antes de aplicar mudanças em produção.