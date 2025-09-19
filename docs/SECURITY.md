# Security Guide - NetPilot

## Visão Geral de Segurança

O NetPilot implementa múltiplas camadas de segurança para proteger o sistema de proxy reverso e garantir que apenas usuários autorizados possam gerenciar domínios e certificados SSL.

## Autenticação e Autorização

### JWT (JSON Web Tokens)

#### Configuração Segura
```typescript
// config/jwt.config.ts
export const jwtConfig = {
  secret: process.env.JWT_SECRET, // DEVE ser forte (256 bits)
  signOptions: {
    expiresIn: '15m', // Token de acesso expira em 15 minutos
    issuer: 'netpilot',
    audience: 'netpilot-api'
  },
  refreshTokenExpiresIn: '7d' // Refresh token expira em 7 dias
};
```

#### Geração de Secret Seguro
```bash
# Gerar JWT secret forte
openssl rand -base64 32

# Configurar no .env
JWT_SECRET=sua_chave_super_secreta_de_256_bits_aqui
JWT_REFRESH_SECRET=outra_chave_secreta_para_refresh_tokens
```

#### Implementação com Refresh Tokens
```typescript
@Injectable()
export class AuthService {
  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    const payload = {
      sub: user.id,
      email: user.email,
      roles: user.roles
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: '7d'
    });

    // Salvar refresh token hasheado no banco
    await this.saveRefreshToken(user.id, refreshToken);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: 900 // 15 minutos
    };
  }

  async refresh(refreshToken: string) {
    // Verificar se refresh token é válido e não foi revogado
    const payload = this.jwtService.verify(refreshToken, {
      secret: this.configService.get('JWT_REFRESH_SECRET')
    });

    const storedToken = await this.getStoredRefreshToken(payload.sub);
    if (!storedToken || !await bcrypt.compare(refreshToken, storedToken)) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Gerar novo access token
    const newPayload = {
      sub: payload.sub,
      email: payload.email,
      roles: payload.roles
    };

    return {
      access_token: this.jwtService.sign(newPayload),
      expires_in: 900
    };
  }
}
```

### Rate Limiting

#### Configuração por Endpoint
```typescript
// guards/rate-limit.guard.ts
@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly limiter = new Map<string, number[]>();

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const key = `${request.ip}:${request.route.path}`;
    const now = Date.now();
    const windowMs = 15 * 60 * 1000; // 15 minutos
    const maxRequests = 100; // 100 requests por 15 minutos

    const requests = this.limiter.get(key) || [];
    const recentRequests = requests.filter(time => now - time < windowMs);

    if (recentRequests.length >= maxRequests) {
      throw new TooManyRequestsException('Rate limit exceeded');
    }

    recentRequests.push(now);
    this.limiter.set(key, recentRequests);
    return true;
  }
}

// Aplicar em endpoints críticos
@Controller('auth')
export class AuthController {
  @Post('login')
  @UseGuards(RateLimitGuard)
  @Throttle(5, 60) // 5 tentativas por minuto
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }
}
```

### Password Security

#### Hashing Seguro
```typescript
@Injectable()
export class PasswordService {
  private readonly saltRounds = 12; // Bcrypt rounds (aumentar conforme CPU)

  async hashPassword(password: string): Promise<string> {
    // Validar força da senha
    if (!this.isPasswordStrong(password)) {
      throw new BadRequestException('Password does not meet security requirements');
    }

    return bcrypt.hash(password, this.saltRounds);
  }

  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  private isPasswordStrong(password: string): boolean {
    // Mínimo 8 caracteres, maiúscula, minúscula, número e símbolo
    const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return strongRegex.test(password);
  }
}
```

## Validação e Sanitização

### DTOs com Validação Rigorosa
```typescript
export class CreateDomainDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$/, {
    message: 'Domain must be a valid hostname'
  })
  @MaxLength(253) // RFC 1035
  name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Matches(/^[a-zA-Z0-9\s\-_\.]+$/, {
    message: 'Description contains invalid characters'
  })
  description?: string;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  autoSsl?: boolean;
}

export class CreateProxyRuleDto {
  @ApiProperty()
  @IsUUID()
  domainId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Matches(/^\/[a-zA-Z0-9\-_\/\*]*$/, {
    message: 'Origin path must start with / and contain only valid characters'
  })
  @MaxLength(200)
  originPath: string;

  @ApiProperty()
  @IsUrl({ require_protocol: true, protocols: ['http', 'https'] })
  @MaxLength(500)
  destinationUrl: string;

  @ApiProperty({ enum: [301, 302, 307, 308] })
  @IsIn([301, 302, 307, 308])
  @IsOptional()
  redirectType?: number;

  @ApiProperty()
  @IsInt()
  @Min(1)
  @Max(1000)
  @IsOptional()
  priority?: number = 100;
}
```

### Sanitização de Inputs
```typescript
// pipes/sanitization.pipe.ts
@Injectable()
export class SanitizationPipe implements PipeTransform {
  transform(value: any) {
    if (typeof value === 'string') {
      // Remove scripts, tags HTML maliciosos
      return value
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<[^>]*>/g, '') // Remove tags HTML
        .trim();
    }

    if (typeof value === 'object' && value !== null) {
      const sanitized = {};
      for (const [key, val] of Object.entries(value)) {
        sanitized[key] = this.transform(val);
      }
      return sanitized;
    }

    return value;
  }
}

// Aplicar globalmente
@Controller()
@UsePipes(new SanitizationPipe())
export class DomainsController {
  // ...
}
```

## SSL/TLS Security

### Configuração Segura do Traefik
```yaml
# configs/traefik/traefik.yml
api:
  dashboard: true
  insecure: false # Nunca usar insecure=true em produção

certificatesResolvers:
  letsencrypt:
    acme:
      email: security@yourcompany.com
      storage: /etc/traefik/acme/acme.json
      caServer: https://acme-v02.api.letsencrypt.org/directory # Produção
      httpChallenge:
        entryPoint: web

# Configurações TLS seguras
tls:
  options:
    default:
      minVersion: "VersionTLS12"
      maxVersion: "VersionTLS13"
      cipherSuites:
        - "TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384"
        - "TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305"
        - "TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256"
      curvePreferences:
        - "CurveP521"
        - "CurveP384"
      sniStrict: true
```

### Headers de Segurança
```yaml
# configs/traefik/dynamic.yml
http:
  middlewares:
    security-headers:
      headers:
        # HSTS
        customRequestHeaders:
          Strict-Transport-Security: "max-age=31536000; includeSubDomains; preload"

        # Prevent clickjacking
        customResponseHeaders:
          X-Frame-Options: "DENY"
          X-Content-Type-Options: "nosniff"
          X-XSS-Protection: "1; mode=block"
          Referrer-Policy: "strict-origin-when-cross-origin"
          Permissions-Policy: "geolocation=(), microphone=(), camera=()"

        # CSP
        contentSecurityPolicy: |
          default-src 'self';
          script-src 'self' 'unsafe-inline';
          style-src 'self' 'unsafe-inline';
          img-src 'self' data: https:;
          connect-src 'self';
          font-src 'self';
          object-src 'none';
          media-src 'self';
          frame-src 'none';

  routers:
    api:
      rule: "Host(`netpilot.example.com`)"
      service: "api@internal"
      middlewares:
        - "security-headers"
      tls:
        certResolver: "letsencrypt"
```

### Validação de Certificados
```typescript
@Injectable()
export class SslCertificateService {
  async validateCertificate(domain: string): Promise<boolean> {
    try {
      // Verificar se o certificado é válido e não expirado
      const cert = await this.getCertificateInfo(domain);

      // Verificar expiração
      if (cert.validTo < new Date()) {
        this.logger.warn(`Certificate expired for domain: ${domain}`);
        return false;
      }

      // Verificar se o domínio corresponde
      if (!cert.subjectAltName.includes(domain)) {
        this.logger.warn(`Domain mismatch in certificate: ${domain}`);
        return false;
      }

      // Verificar cadeia de certificação
      if (!cert.issuer.includes('Let\'s Encrypt') && !cert.issuer.includes('Trusted CA')) {
        this.logger.warn(`Untrusted certificate issuer: ${cert.issuer}`);
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error(`Certificate validation failed: ${error.message}`);
      return false;
    }
  }
}
```

## Configuração Segura do Nginx

### Templates de Configuração Segura
```nginx
# configs/nginx/templates/secure-proxy.conf
server {
    listen 80;
    server_name {{DOMAIN}};

    # Security headers
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Hide server information
    server_tokens off;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;

    # Request size limits
    client_max_body_size 10M;
    client_body_timeout 30s;
    client_header_timeout 30s;

    # Buffer security
    client_body_buffer_size 128k;
    client_header_buffer_size 1k;
    large_client_header_buffers 4 4k;

    location / {
        # Proxy settings
        proxy_pass {{DESTINATION_URL}};
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Security
        proxy_hide_header X-Powered-By;
        proxy_hide_header Server;

        # Timeouts
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;

        # Buffer settings
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
        proxy_busy_buffers_size 8k;
    }

    # Block common attack patterns
    location ~* /(wp-admin|wp-login|admin|phpmyadmin|\.git|\.env) {
        deny all;
        return 404;
    }

    # Block file extensions
    location ~* \.(php|php3|php4|php5|phtml|pl|py|jsp|asp|sh|cgi)$ {
        deny all;
        return 404;
    }
}
```

## Database Security

### Configuração Segura do PostgreSQL
```yaml
# docker-compose.yml
services:
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: ${DB_NAME}
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      # Configurações de segurança
      POSTGRES_INITDB_ARGS: "--auth-host=md5 --auth-local=md5"
    command: [
      "postgres",
      "-c", "log_statement=all",
      "-c", "log_min_duration_statement=1000",
      "-c", "ssl=on",
      "-c", "shared_preload_libraries=pg_stat_statements",
      "-c", "max_connections=100",
      "-c", "shared_buffers=256MB"
    ]
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./configs/postgres/postgresql.conf:/etc/postgresql/postgresql.conf
    networks:
      - netpilot-internal
```

### Query Security
```typescript
// Usar TypeORM QueryBuilder para prevenir SQL Injection
@Injectable()
export class DomainsService {
  async findByName(name: string): Promise<Domain> {
    // CORRETO: Usar parâmetros
    return this.domainRepository
      .createQueryBuilder('domain')
      .where('domain.name = :name', { name })
      .getOne();
  }

  async searchDomains(query: string): Promise<Domain[]> {
    // CORRETO: Escapar caracteres especiais para LIKE
    const escapedQuery = query.replace(/[%_]/g, '\\$&');

    return this.domainRepository
      .createQueryBuilder('domain')
      .where('domain.name ILIKE :query', { query: `%${escapedQuery}%` })
      .orWhere('domain.description ILIKE :query', { query: `%${escapedQuery}%` })
      .getMany();
  }
}
```

## Logs e Auditoria

### Structured Logging para Segurança
```typescript
@Injectable()
export class SecurityLogger {
  private readonly logger = new Logger(SecurityLogger.name);

  logAuthAttempt(email: string, ip: string, success: boolean) {
    this.logger.log({
      event: 'auth_attempt',
      email,
      ip,
      success,
      timestamp: new Date().toISOString(),
      user_agent: this.getCurrentUserAgent()
    });
  }

  logPrivilegedAction(userId: string, action: string, resource: string, ip: string) {
    this.logger.warn({
      event: 'privileged_action',
      userId,
      action,
      resource,
      ip,
      timestamp: new Date().toISOString()
    });
  }

  logSecurityEvent(event: string, details: any, severity: 'low' | 'medium' | 'high' | 'critical') {
    const logMethod = severity === 'critical' ? 'error' :
                     severity === 'high' ? 'warn' : 'log';

    this.logger[logMethod]({
      event: 'security_event',
      type: event,
      severity,
      details,
      timestamp: new Date().toISOString()
    });
  }
}

// Interceptor para auditoria automática
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private securityLogger: SecurityLogger) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, ip, user } = request;

    // Log ações em recursos críticos
    if (this.isCriticalResource(url)) {
      this.securityLogger.logPrivilegedAction(
        user?.id || 'anonymous',
        method,
        url,
        ip
      );
    }

    return next.handle();
  }

  private isCriticalResource(url: string): boolean {
    const criticalPaths = [
      '/domains',
      '/ssl-certificates',
      '/proxy-rules',
      '/users'
    ];

    return criticalPaths.some(path => url.includes(path));
  }
}
```

## Environment Security

### Configuração Segura de Variáveis
```bash
# .env.production (exemplo)
# Database
DB_HOST=meadadigital.com
DB_PORT=5432
DB_USERNAME=netpilot_prod
DB_PASSWORD=ComplexPassword123!@#
DB_NAME=netpilot_prod

# JWT
JWT_SECRET=very_long_and_complex_secret_key_256_bits_minimum
JWT_REFRESH_SECRET=another_very_long_refresh_secret_key

# SSL
ACME_STAGING=false
ACME_EMAIL=security@yourcompany.com

# Security
NODE_ENV=production
CORS_ORIGINS=https://netpilot.yourcompany.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Monitoring
LOG_LEVEL=warn
ENABLE_SECURITY_LOGGING=true
```

### Secrets Management
```bash
# Usar Docker Secrets em produção
echo "your_jwt_secret" | docker secret create jwt_secret -
echo "your_db_password" | docker secret create db_password -

# docker-compose.prod.yml
version: '3.8'
services:
  backend:
    secrets:
      - jwt_secret
      - db_password
    environment:
      JWT_SECRET_FILE: /run/secrets/jwt_secret
      DB_PASSWORD_FILE: /run/secrets/db_password

secrets:
  jwt_secret:
    external: true
  db_password:
    external: true
```

## Hardening Checklist

### Aplicação
- [ ] JWT secrets têm pelo menos 256 bits
- [ ] Refresh tokens são rotacionados
- [ ] Rate limiting está configurado
- [ ] Validação rigorosa de inputs
- [ ] Headers de segurança configurados
- [ ] Logs de auditoria funcionando
- [ ] Secrets não estão no código

### Infraestrutura
- [ ] PostgreSQL usa senha forte
- [ ] SSL/TLS configurado corretamente
- [ ] Nginx esconde informações do servidor
- [ ] Traefik dashboard protegido
- [ ] Certificados SSL válidos
- [ ] Backup criptografado
- [ ] Firewall configurado

### Monitoramento
- [ ] Logs de tentativas de login
- [ ] Alertas para ações privilegiadas
- [ ] Monitoramento de certificados expirados
- [ ] Alertas de falhas de segurança
- [ ] Backup regular dos logs

## Incident Response

### Procedimentos de Emergência
```bash
# 1. Bloqueio imediato de usuário suspeito
curl -X PATCH http://meadadigital.com:3001/users/{id}/block \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# 2. Revogar todos os tokens de um usuário
curl -X POST http://meadadigital.com:3001/auth/revoke-all \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"userId": "user-id"}'

# 3. Backup imediato dos logs
docker-compose exec db pg_dump -U netpilot -t logs > security-incident-$(date +%Y%m%d).sql

# 4. Análise de logs suspeitos
docker-compose logs | grep -E "(WARN|ERROR)" | grep -i "security"

# 5. Renovação de certificados comprometidos
curl -X POST http://meadadigital.com:3001/ssl-certificates/emergency-renew
```

### Contatos de Emergência
- **Security Team**: security@yourcompany.com
- **On-call Engineer**: +55 (11) 99999-9999
- **Certificate Authority**: suporte@ca-provider.com

---

**Importante**: Mantenha este guia sempre atualizado e revise as configurações de segurança regularmente.