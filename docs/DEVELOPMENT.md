# Development Guide - NetPilot

## Overview

Este guia fornece todas as informações necessárias para desenvolvedores contribuírem com o projeto NetPilot.

## Pré-requisitos

### Software Necessário
- Node.js 18+ e npm
- Docker e Docker Compose
- Git
- VSCode (recomendado)

### Configuração do Ambiente
```bash
# Clonar repositório
git clone <repository-url>
cd netpilot

# Configurar ambiente
cp .env.example .env
./scripts/setup.sh

# Instalar dependências
cd backend && npm install
cd ../frontend && npm install
```

## Arquitetura do Projeto

### Backend (NestJS)
```
backend/src/
├── config/           # Configurações
├── dtos/            # Data Transfer Objects
├── entities/        # Entidades TypeORM
├── modules/         # Módulos funcionais
│   ├── auth/        # Autenticação JWT
│   ├── domains/     # Gestão de domínios
│   ├── proxy-rules/ # Regras de proxy
│   ├── redirects/   # Redirecionamentos
│   ├── ssl-certificates/ # Certificados SSL
│   ├── logs/        # Sistema de logs
│   └── dashboard/   # Métricas
├── services/        # Serviços globais
└── seeds/          # Seeds do banco
```

### Frontend (Next.js)
```
frontend/src/
├── app/             # Páginas Next.js 14
├── components/      # Componentes React
├── hooks/          # Custom hooks
├── lib/            # Utilitários
├── stores/         # Estado Zustand
├── types/          # Tipos TypeScript
└── utils/          # Funções auxiliares
```

## Fluxo de Desenvolvimento

### 1. Configuração Inicial
```bash
# Iniciar serviços de desenvolvimento
docker-compose up -d db

# Backend em modo watch
cd backend
npm run start:dev

# Frontend em modo watch
cd frontend
npm run dev
```

### 2. Workflow de Feature
```bash
# Criar branch para feature
git checkout -b feature/nome-da-feature

# Implementar mudanças
# Backend: criar/editar módulos, DTOs, entidades
# Frontend: criar/editar páginas, componentes

# Testes
npm run test
npm run test:e2e

# Commit e push
git add .
git commit -m "feat: descrição da feature"
git push origin feature/nome-da-feature

# Criar Pull Request
```

### 3. Estrutura de Commits
```
feat: nova funcionalidade
fix: correção de bug
docs: documentação
style: formatação (sem mudança de código)
refactor: refatoração de código
test: adicionar/corrigir testes
chore: tarefas de build/deploy
```

## Padrões de Código

### Backend (NestJS)

#### Controllers
```typescript
@Controller('domains')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DomainsController {
  @Get()
  @ApiOperation({ summary: 'List all domains' })
  @ApiResponse({ status: 200, type: [DomainResponseDto] })
  async findAll(@Query() query: DomainQueryDto) {
    return this.domainsService.findAll(query);
  }
}
```

#### Services
```typescript
@Injectable()
export class DomainsService {
  constructor(
    @InjectRepository(Domain)
    private domainRepository: Repository<Domain>,
  ) {}

  async findAll(query: DomainQueryDto): Promise<Domain[]> {
    const queryBuilder = this.domainRepository.createQueryBuilder('domain');

    if (query.search) {
      queryBuilder.andWhere('domain.name ILIKE :search', {
        search: `%${query.search}%`,
      });
    }

    return queryBuilder.getMany();
  }
}
```

#### DTOs com Validação
```typescript
export class CreateDomainDto {
  @ApiProperty({ description: 'Domain name' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, {
    message: 'Domain must be valid',
  })
  name: string;

  @ApiProperty({ description: 'Domain description', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Enable auto SSL', default: true })
  @IsBoolean()
  @IsOptional()
  autoSsl?: boolean = true;
}
```

#### Entidades TypeORM
```typescript
@Entity()
export class Domain {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ default: true })
  enabled: boolean;

  @Column({ default: true, name: 'auto_ssl' })
  autoSsl: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => ProxyRule, rule => rule.domain)
  proxyRules: ProxyRule[];
}
```

### Frontend (Next.js)

#### Componentes
```typescript
interface DomainListProps {
  domains: Domain[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function DomainList({ domains, onEdit, onDelete }: DomainListProps) {
  return (
    <div className="space-y-4">
      {domains.map((domain) => (
        <DomainCard
          key={domain.id}
          domain={domain}
          onEdit={() => onEdit(domain.id)}
          onDelete={() => onDelete(domain.id)}
        />
      ))}
    </div>
  );
}
```

#### Hooks Personalizados
```typescript
export function useDomains() {
  return useQuery({
    queryKey: ['domains'],
    queryFn: () => api.get('/domains').then(res => res.data),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCreateDomain() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateDomainDto) =>
      api.post('/domains', data).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['domains'] });
      toast.success('Domain created successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error creating domain');
    },
  });
}
```

#### Estado Zustand
```typescript
interface AuthStore {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  token: localStorage.getItem('token'),

  get isAuthenticated() {
    return !!get().token;
  },

  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    const { user, token } = response.data;

    localStorage.setItem('token', token);
    set({ user, token });
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null });
  },
}));
```

## Testes

### Testes Unitários (Backend)
```typescript
describe('DomainsService', () => {
  let service: DomainsService;
  let repository: Repository<Domain>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        DomainsService,
        {
          provide: getRepositoryToken(Domain),
          useClass: Repository,
        },
      ],
    }).compile();

    service = module.get<DomainsService>(DomainsService);
    repository = module.get<Repository<Domain>>(getRepositoryToken(Domain));
  });

  it('should find all domains', async () => {
    const domains = [{ id: '1', name: 'example.com' }];
    jest.spyOn(repository, 'createQueryBuilder').mockReturnValue({
      getMany: jest.fn().mockResolvedValue(domains),
    } as any);

    const result = await service.findAll({});
    expect(result).toEqual(domains);
  });
});
```

### Testes de Integração
```typescript
describe('DomainsController (e2e)', () => {
  let app: INestApplication;
  let repository: Repository<Domain>;

  beforeEach(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    repository = moduleFixture.get<Repository<Domain>>(getRepositoryToken(Domain));
    await app.init();
  });

  it('/domains (GET)', () => {
    return request(app.getHttpServer())
      .get('/domains')
      .expect(200)
      .expect((res) => {
        expect(Array.isArray(res.body)).toBeTruthy();
      });
  });
});
```

## Debugging

### Backend
```bash
# Debug mode
npm run start:debug

# VSCode launch.json
{
  "type": "node",
  "request": "attach",
  "name": "Attach to NestJS",
  "port": 9229,
  "restart": true
}
```

### Frontend
```bash
# Next.js debug
DEBUG=* npm run dev

# Browser DevTools
# React DevTools extension
# React Query DevTools (built-in)
```

## Database

### Migrations
```bash
# Gerar migration
npm run migration:generate -- -n CreateDomainTable

# Executar migrations
npm run migration:run

# Reverter migration
npm run migration:revert
```

### Seeds
```bash
# Executar seeds
npm run seed

# Seed customizado
npx ts-node src/seeds/custom-seed.ts
```

## Build e Deploy

### Desenvolvimento
```bash
# Backend
cd backend
npm run start:dev

# Frontend
cd frontend
npm run dev
```

### Produção
```bash
# Build completo
docker-compose -f docker-compose.prod.yml up -d --build

# Build individual
cd backend && npm run build
cd frontend && npm run build
```

## Ferramentas de Desenvolvimento

### VSCode Extensions
```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next",
    "ms-vscode.vscode-eslint",
    "ms-vscode-remote.remote-containers"
  ]
}
```

### Prettier Config
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2
}
```

### ESLint Config
```json
{
  "extends": [
    "@nestjs",
    "prettier"
  ],
  "rules": {
    "@typescript-eslint/interface-name-prefix": "off",
    "@typescript-eslint/explicit-function-return-type": "off"
  }
}
```

## Performance

### Backend Optimization
- Use conexões de banco otimizadas
- Implement caching com Redis (futuro)
- Use lazy loading nas relações TypeORM
- Implement pagination para listas grandes

### Frontend Optimization
- Use Next.js Image Optimization
- Implement lazy loading de componentes
- Use React.memo para componentes pesados
- Otimize bundle size com análise

## Segurança

### Autenticação
- JWT tokens com expiração
- Refresh tokens para sessões longas
- Rate limiting nas rotas de auth
- Validação rigorosa de inputs

### Autorização
- Guards baseados em roles
- Validação de ownership de recursos
- Sanitização de dados de entrada
- Headers de segurança

## Monitoramento

### Logs
```typescript
// Structured logging
this.logger.log('Domain created', {
  domainId: domain.id,
  userId: user.id,
  timestamp: new Date().toISOString()
});
```

### Metrics
- Tempo de resposta das APIs
- Taxa de sucesso/erro
- Usage tracking por usuário
- Performance do banco de dados

## Contribuição

### Code Review
- Toda feature deve passar por code review
- Cobertura de testes > 80%
- Documentação atualizada
- Performance verificada

### Standards
- Seguir convenções TypeScript/NestJS/Next.js
- Usar tipos explícitos
- Documentar APIs complexas
- Testes para casos edge

## FAQ

**Q: Como adicionar um novo módulo no backend?**
A: Use `nest g module nome-modulo` e siga a estrutura existente.

**Q: Como configurar variáveis de ambiente?**
A: Adicione no `.env` e configure no `config.service.ts`.

**Q: Como fazer deploy?**
A: Use `docker-compose.prod.yml` para produção.

**Q: Como debuggar problemas de SSL?**
A: Verifique logs do Traefik e certificados em `/configs/ssl/`.