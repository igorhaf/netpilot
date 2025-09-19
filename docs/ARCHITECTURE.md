# Arquitetura do Sistema NetPilot

## Visão Geral

NetPilot é uma solução de proxy reverso baseada em microserviços que combina múltiplas tecnologias para oferecer um sistema robusto de gestão de domínios, SSL e roteamento de tráfego.

## Diagrama de Arquitetura

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Internet / External Traffic                      │
└─────────────────────────┬───────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        Load Balancer Layer                                 │
│  ┌─────────────────────┐    ┌─────────────────────┐    ┌────────────────┐   │
│  │     Traefik         │    │    Let's Encrypt    │    │  External DNS  │   │
│  │  - Proxy Reverso    │◄──►│   - SSL Automático  │    │  - Resolução   │   │
│  │  - SSL Termination  │    │   - Renovação Auto  │    │  - Validação   │   │
│  │  - Load Balancing   │    │   - Certificados    │    │  - ACME        │   │
│  │  - Roteamento       │    └─────────────────────┘    └────────────────┘   │
│  │  Portas: 80,443,8080│                                                   │
│  └─────────────────────┘                                                   │
└─────────────────────────┬───────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        Application Layer                                   │
│  ┌─────────────────────┐              ┌─────────────────────┐              │
│  │      Frontend       │              │      Backend        │              │
│  │   ┌─────────────┐   │              │   ┌─────────────┐   │              │
│  │   │   Next.js   │   │◄────────────►│   │   NestJS    │   │              │
│  │   │ TypeScript  │   │   REST API   │   │ TypeScript  │   │              │
│  │   │ Tailwind    │   │   HTTP/HTTPS │   │ TypeORM     │   │              │
│  │   │ Zustand     │   │              │   │ JWT Auth    │   │              │
│  │   │ TanStack    │   │              │   │ Validation  │   │              │
│  │   └─────────────┘   │              │   └─────────────┘   │              │
│  │   Porto: 3000       │              │   Porto: 3001       │              │
│  └─────────────────────┘              └─────────────────────┘              │
└─────────────────────────┬───────────────────────────┬───────────────────────┘
                          │                           │
                          ▼                           ▼
┌─────────────────────────────────────┐    ┌─────────────────────────────────┐
│          Data Layer                 │    │       Service Layer            │
│  ┌─────────────────────┐            │    │  ┌─────────────────────┐       │
│  │    PostgreSQL       │            │    │  │       Nginx         │       │
│  │  ┌───────────────┐  │            │    │  │  ┌───────────────┐  │       │
│  │  │   Database    │  │            │    │  │  │ Config Files  │  │       │
│  │  │ - Users       │  │            │    │  │  │ - Virtual     │  │       │
│  │  │ - Domains     │  │            │    │  │  │   Hosts       │  │       │
│  │  │ - ProxyRules  │  │            │    │  │  │ - SSL Certs   │  │       │
│  │  │ - Redirects   │  │            │    │  │  │ - Proxying    │  │       │
│  │  │ - SSL Certs   │  │            │    │  │  └───────────────┘  │       │
│  │  │ - Logs        │  │            │    │  │  Porto: 8081        │       │
│  │  └───────────────┘  │            │    │  └─────────────────────┘       │
│  │  Porto: 5432        │            │    └─────────────────────────────────┘
│  └─────────────────────┘            │
└─────────────────────────────────────┘
```

## Componentes Principais

### 1. Load Balancer Layer

#### Traefik (Proxy Principal)
- **Responsabilidade**: Proxy reverso principal, terminação SSL, roteamento
- **Portas**: 80 (HTTP), 443 (HTTPS), 8080 (Dashboard)
- **Funcionalidades**:
  - Roteamento baseado em domínio/path
  - Terminação SSL automática
  - Load balancing entre múltiplos backends
  - Service discovery dinâmico
  - Dashboard de monitoramento
  - Integração com Let's Encrypt

#### Let's Encrypt Integration
- **Responsabilidade**: Geração e renovação automática de certificados SSL
- **Processo**:
  ```
  Domain Request → DNS Challenge → Certificate Issue → Auto Renewal
  ```

### 2. Application Layer

#### Frontend (Next.js)
- **Tecnologias**:
  - Next.js 14 (App Router)
  - TypeScript
  - Tailwind CSS
  - Zustand (State Management)
  - TanStack Query (Data Fetching)
  - React Hook Form (Forms)

- **Estrutura**:
  ```
  frontend/
  ├── src/
  │   ├── app/                    # App Router (Next.js 14)
  │   │   ├── (auth)/            # Auth group
  │   │   ├── dashboard/         # Dashboard pages
  │   │   ├── domains/           # Domain management
  │   │   ├── proxy-rules/       # Proxy rule management
  │   │   └── ssl-certificates/  # SSL management
  │   ├── components/            # Reusable components
  │   │   ├── ui/               # Base UI components
  │   │   ├── forms/            # Form components
  │   │   └── layout/           # Layout components
  │   ├── lib/                  # Utilities
  │   │   ├── api.ts           # API client
  │   │   ├── auth.ts          # Auth utilities
  │   │   └── utils.ts         # General utilities
  │   └── types/               # TypeScript types
  ```

#### Backend (NestJS)
- **Tecnologias**:
  - NestJS (Framework)
  - TypeScript
  - TypeORM (ORM)
  - PostgreSQL (Database)
  - JWT (Authentication)
  - class-validator (Validation)
  - Swagger (Documentation)

- **Arquitetura em Módulos**:
  ```
  backend/
  ├── src/
  │   ├── auth/                 # Authentication module
  │   │   ├── guards/          # Auth guards
  │   │   ├── strategies/      # Passport strategies
  │   │   └── dto/            # Data Transfer Objects
  │   ├── domains/             # Domain management
  │   ├── proxy-rules/         # Proxy rule management
  │   ├── redirects/           # Redirect management
  │   ├── ssl-certificates/    # SSL certificate management
  │   ├── logs/               # Logging system
  │   ├── dashboard/          # Dashboard metrics
  │   ├── common/             # Shared utilities
  │   │   ├── decorators/     # Custom decorators
  │   │   ├── filters/        # Exception filters
  │   │   ├── interceptors/   # Interceptors
  │   │   └── pipes/          # Validation pipes
  │   └── config/             # Configuration
  ```

### 3. Data Layer

#### PostgreSQL Database
- **Schema Principal**:
  ```sql
  -- Usuários do sistema
  users (
    id SERIAL PRIMARY KEY,
    email VARCHAR UNIQUE NOT NULL,
    password_hash VARCHAR NOT NULL,
    role VARCHAR DEFAULT 'user',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  );

  -- Domínios configurados
  domains (
    id SERIAL PRIMARY KEY,
    domain VARCHAR UNIQUE NOT NULL,
    enabled BOOLEAN DEFAULT true,
    user_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  );

  -- Regras de proxy
  proxy_rules (
    id SERIAL PRIMARY KEY,
    domain_id INTEGER REFERENCES domains(id),
    source_path VARCHAR DEFAULT '/',
    target_url VARCHAR NOT NULL,
    enabled BOOLEAN DEFAULT true,
    load_balancing_method VARCHAR DEFAULT 'round_robin',
    health_check_url VARCHAR,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  );

  -- Redirecionamentos
  redirects (
    id SERIAL PRIMARY KEY,
    domain_id INTEGER REFERENCES domains(id),
    source_path VARCHAR NOT NULL,
    target_url VARCHAR NOT NULL,
    redirect_type INTEGER DEFAULT 301,
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  );

  -- Certificados SSL
  ssl_certificates (
    id SERIAL PRIMARY KEY,
    domain_id INTEGER REFERENCES domains(id),
    certificate_path VARCHAR,
    private_key_path VARCHAR,
    issuer VARCHAR,
    expires_at TIMESTAMP,
    auto_renew BOOLEAN DEFAULT true,
    status VARCHAR DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  );

  -- Logs do sistema
  logs (
    id SERIAL PRIMARY KEY,
    level VARCHAR NOT NULL,
    message TEXT NOT NULL,
    context JSONB,
    user_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
  );
  ```

### 4. Service Layer

#### Nginx (Web Server Secundário)
- **Responsabilidade**: Servir arquivos estáticos, configurações específicas
- **Configuração Dinâmica**: Templates gerados automaticamente pelo backend
- **Localização**: `configs/nginx/`

## Fluxo de Dados

### 1. Fluxo de Requisição HTTP/HTTPS

```
Internet Request
     │
     ▼
┌─────────────┐
│   Traefik   │ ── DNS Resolution
│  (Port 80)  │
└─────────────┘
     │
     ▼
┌─────────────┐
│ SSL Check   │ ── Let's Encrypt
│ & Redirect  │
└─────────────┘
     │
     ▼
┌─────────────┐
│ Route Match │ ── Domain Rules
│ & Forward   │
└─────────────┘
     │
     ▼
┌─────────────┐
│Target Server│ ── Backend/Frontend
│ (Upstream)  │
└─────────────┘
```

### 2. Fluxo de Configuração

```
User Action (Frontend)
     │
     ▼
┌─────────────┐
│ REST API    │ ── Authentication
│ (Backend)   │
└─────────────┘
     │
     ▼
┌─────────────┐
│ Database    │ ── Data Persistence
│ Update      │
└─────────────┘
     │
     ▼
┌─────────────┐
│Config Update│ ── File Generation
│(Nginx/Traf.)│
└─────────────┘
     │
     ▼
┌─────────────┐
│Service      │ ── Graceful Reload
│Reload       │
└─────────────┘
```

### 3. Fluxo de SSL

```
SSL Request
     │
     ▼
┌─────────────┐
│Domain       │ ── DNS Validation
│Validation   │
└─────────────┘
     │
     ▼
┌─────────────┐
│ACME         │ ── Let's Encrypt
│Challenge    │
└─────────────┘
     │
     ▼
┌─────────────┐
│Certificate  │ ── Store in DB
│Generation   │
└─────────────┘
     │
     ▼
┌─────────────┐
│Config       │ ── Update Traefik
│Update       │
└─────────────┘
```

## Padrões de Design

### 1. Backend (NestJS)

#### Dependency Injection
```typescript
@Injectable()
export class DomainsService {
  constructor(
    @InjectRepository(Domain)
    private readonly domainRepository: Repository<Domain>,
    private readonly sslService: SslCertificateService,
    private readonly configService: ConfigService,
  ) {}
}
```

#### Guards e Interceptors
```typescript
@Controller('domains')
@UseGuards(JwtAuthGuard)
@UseInterceptors(LoggingInterceptor)
export class DomainsController {
  @Post()
  @UsePipes(ValidationPipe)
  async create(@Body() createDomainDto: CreateDomainDto) {
    return this.domainsService.create(createDomainDto);
  }
}
```

#### DTOs e Validation
```typescript
export class CreateDomainDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
  domain: string;

  @IsBoolean()
  @IsOptional()
  enabled?: boolean = true;
}
```

### 2. Frontend (Next.js)

#### Server Components + Client Components
```typescript
// Server Component (async data fetching)
async function DomainsPage() {
  const domains = await getDomains();
  return <DomainsList initialData={domains} />;
}

// Client Component (interactivity)
'use client';
function DomainsList({ initialData }) {
  const { data, mutate } = useSWR('/api/domains', fetcher, {
    fallbackData: initialData
  });
}
```

#### State Management (Zustand)
```typescript
interface AppState {
  user: User | null;
  domains: Domain[];
  loading: boolean;
  setUser: (user: User) => void;
  addDomain: (domain: Domain) => void;
}

export const useAppStore = create<AppState>()((set) => ({
  user: null,
  domains: [],
  loading: false,
  setUser: (user) => set({ user }),
  addDomain: (domain) => set((state) => ({
    domains: [...state.domains, domain]
  })),
}));
```

## Segurança

### 1. Autenticação e Autorização

#### JWT Strategy
```typescript
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    return { userId: payload.sub, email: payload.email };
  }
}
```

#### Refresh Token Strategy
```typescript
@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get('JWT_REFRESH_SECRET'),
      passReqToCallback: true,
    });
  }
}
```

### 2. Validação e Sanitização

#### Input Validation
```typescript
@ValidatorConstraint()
export class IsDomainConstraint implements ValidatorConstraintInterface {
  validate(domain: string) {
    const domainRegex = /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return domainRegex.test(domain);
  }
}
```

### 3. Rate Limiting
```typescript
@UseGuards(ThrottlerGuard)
@Throttle(10, 60) // 10 requests per minute
@Controller('auth')
export class AuthController {}
```

## Performance

### 1. Database Optimization

#### Indexes
```sql
-- Índices para performance
CREATE INDEX idx_domains_user_id ON domains(user_id);
CREATE INDEX idx_proxy_rules_domain_id ON proxy_rules(domain_id);
CREATE INDEX idx_ssl_certificates_expires_at ON ssl_certificates(expires_at);
CREATE INDEX idx_logs_created_at ON logs(created_at);
CREATE INDEX idx_logs_level ON logs(level);
```

#### Connection Pooling
```typescript
TypeOrmModule.forRoot({
  type: 'postgres',
  poolSize: 20,
  extra: {
    connectionLimit: 25,
    acquireTimeout: 60000,
    timeout: 60000,
  },
});
```

### 2. Caching Strategy

#### Redis (futuro)
```typescript
@Injectable()
export class CacheService {
  @Cache(300) // 5 minutes
  async getDomains(userId: number): Promise<Domain[]> {
    return this.domainRepository.find({ where: { userId } });
  }
}
```

### 3. Frontend Optimization

#### Bundle Splitting
```typescript
// next.config.js
module.exports = {
  experimental: {
    optimizePackageImports: ['@heroicons/react', 'date-fns'],
  },
  webpack: (config) => {
    config.optimization.splitChunks.chunks = 'all';
    return config;
  },
};
```

## Monitoramento

### 1. Health Checks
```typescript
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.db.pingCheck('database'),
    ]);
  }
}
```

### 2. Logging Strategy
```typescript
export class CustomLogger implements LoggerService {
  log(message: string, context?: string) {
    // Structured logging com timestamp, level, context
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'info',
      message,
      context,
    }));
  }
}
```

### 3. Metrics (Prometheus)
```typescript
@Injectable()
export class MetricsService {
  private httpRequestDuration = new Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status'],
  });

  recordHttpRequest(method: string, route: string, status: number, duration: number) {
    this.httpRequestDuration.labels(method, route, status.toString()).observe(duration);
  }
}
```

## Decisões Arquiteturais

### 1. Por que NestJS?
- **Modularidade**: Arquitetura baseada em módulos facilita manutenção
- **TypeScript**: Type safety em todo o backend
- **Dependency Injection**: Facilita testes e manutenção
- **Decorators**: Metaprogramação elegante para validação, auth, etc.
- **Ecosystem**: Integração nativa com TypeORM, Passport, Swagger

### 2. Por que Next.js?
- **Server Components**: Performance superior com rendering no servidor
- **App Router**: Roteamento mais intuitivo e performático
- **TypeScript**: Integração nativa com TS
- **Build Optimization**: Bundle splitting automático
- **Developer Experience**: Hot reload, debugging, etc.

### 3. Por que Traefik?
- **Service Discovery**: Auto-discovery de serviços
- **Let's Encrypt**: Integração nativa para SSL automático
- **Load Balancing**: Algoritmos avançados de balanceamento
- **Dashboard**: Interface visual para monitoramento
- **Docker Integration**: Integração nativa com Docker

### 4. Por que PostgreSQL?
- **ACID Compliance**: Transações confiáveis
- **JSON Support**: Campos JSONB para logs estruturados
- **Performance**: Otimizado para workloads complexos
- **Extensions**: PostGIS, pg_stat_statements, etc.
- **Ecosystem**: Amplo suporte de ferramentas

## Escalabilidade

### 1. Horizontal Scaling
```yaml
# docker-compose.scale.yml
version: '3.8'
services:
  backend:
    deploy:
      replicas: 3
  frontend:
    deploy:
      replicas: 2
  db:
    deploy:
      replicas: 1 # Master-slave setup
```

### 2. Database Scaling
```typescript
// Read replicas
@Injectable()
export class DatabaseService {
  constructor(
    @InjectDataSource('master') private masterDb: DataSource,
    @InjectDataSource('slave') private slaveDb: DataSource,
  ) {}

  async read(query: string) {
    return this.slaveDb.query(query);
  }

  async write(query: string) {
    return this.masterDb.query(query);
  }
}
```

### 3. CDN Integration
```typescript
// Asset optimization
export function getOptimizedImageUrl(path: string, width: number) {
  if (process.env.CDN_URL) {
    return `${process.env.CDN_URL}/images/${path}?w=${width}&f=webp`;
  }
  return `/images/${path}`;
}
```

## Futuras Melhorias

### 1. Microservices
- Separar módulos em serviços independentes
- Service mesh com Istio
- Event-driven architecture com RabbitMQ

### 2. Observabilidade
- Distributed tracing com Jaeger
- Metrics com Prometheus + Grafana
- Log aggregation com ELK Stack

### 3. CI/CD
- GitHub Actions para deploy automático
- Testes automatizados em múltiplos ambientes
- Blue-green deployment

### 4. Machine Learning
- Análise preditiva de tráfego
- Detecção de anomalias
- Auto-scaling baseado em ML