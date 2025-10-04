"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StacksPresetsSeed = void 0;
const stack_entity_1 = require("../entities/stack.entity");
const preset_entity_1 = require("../entities/preset.entity");
class StacksPresetsSeed {
    async run(dataSource) {
        const stackRepo = dataSource.getRepository(stack_entity_1.Stack);
        const presetRepo = dataSource.getRepository(preset_entity_1.Preset);
        console.log('🌱 Iniciando seed de Stacks e Presets...');
        await this.createLaravelStack(stackRepo, presetRepo);
        console.log('✅ Stack Laravel criada');
        await this.createNextStack(stackRepo, presetRepo);
        console.log('✅ Stack Next.js criada');
        await this.createReactNativeStack(stackRepo, presetRepo);
        console.log('✅ Stack React Native criada');
        await this.createSharedPresets(presetRepo);
        console.log('✅ Presets compartilhados criados');
        console.log('🎉 Seed concluído com sucesso!');
    }
    async createLaravelStack(stackRepo, presetRepo) {
        const dockerCompose = await presetRepo.save({
            name: 'Laravel Docker Stack',
            description: 'Docker Compose completo para Laravel com PHP 8.2, MySQL e Nginx',
            type: 'docker',
            filename: 'docker-compose.yml',
            content: `version: '3.8'

services:
  app:
    image: php:8.2-fpm
    container_name: laravel-app
    working_dir: /var/www
    volumes:
      - ./:/var/www
    networks:
      - laravel

  nginx:
    image: nginx:alpine
    container_name: laravel-nginx
    ports:
      - "8000:80"
    volumes:
      - ./:/var/www
      - ./docker/nginx/default.conf:/etc/nginx/conf.d/default.conf
    depends_on:
      - app
    networks:
      - laravel

  mysql:
    image: mysql:8.0
    container_name: laravel-mysql
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: laravel
      MYSQL_USER: laravel
      MYSQL_PASSWORD: laravel
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
    networks:
      - laravel

networks:
  laravel:
    driver: bridge

volumes:
  mysql_data:
    driver: local`,
            language: 'yaml',
            tags: ['laravel', 'php', 'docker', 'mysql', 'nginx'],
            size: 0
        });
        const persona = await presetRepo.save({
            name: 'Laravel Backend Developer',
            description: 'Persona especializada em desenvolvimento Laravel/PHP',
            type: 'persona',
            filename: 'backend-developer.md',
            content: `# Persona: Laravel Backend Developer

Você é um desenvolvedor Laravel sênior com 10+ anos de experiência em PHP. Sempre siga estas diretrizes:

## Código PHP
- Use PHP 8.2+ com type hints estritos em todos os métodos
- Siga rigorosamente PSR-12 para formatação de código
- Declare tipos de retorno em todas as funções/métodos
- Use readonly properties quando apropriado (PHP 8.1+)

## Laravel Conventions
- Crie migrations para TODAS as alterações de schema
- Use Eloquent ORM com relationships corretas (hasMany, belongsTo, etc.)
- Implemente validação via Form Requests, nunca inline no controller
- Crie Resources para transformação de dados em APIs
- Use Jobs para tarefas assíncronas (emails, processamento pesado)

## Arquitetura
- Controllers magros - apenas recebem request e retornam response
- Services para lógica de negócio complexa
- Repositories apenas se houver múltiplas fontes de dados
- Use Actions para operações single-responsibility

## Testes
- Crie testes Feature para endpoints
- Crie testes Unit para Services e Actions
- Use factories e seeders para dados de teste
- Mínimo 80% de cobertura

## APIs
- Use API Resources para serialização
- Implemente versionamento (v1, v2)
- Documente com annotations OpenAPI/Swagger
- Sempre retorne status codes corretos (200, 201, 404, 422, 500)

## Segurança
- Sanitize TODOS os inputs
- Use prepared statements (Eloquent faz automaticamente)
- Implemente rate limiting
- Valide CORS adequadamente

## Performance
- Use eager loading para evitar N+1 queries
- Implemente cache quando apropriado (Redis)
- Use queue para operações demoradas
- Adicione índices em colunas frequentemente pesquisadas`,
            language: 'markdown',
            tags: ['laravel', 'backend', 'persona', 'php'],
            size: 0
        });
        const envConfig = await presetRepo.save({
            name: 'Laravel Environment Template',
            description: 'Template de .env para projetos Laravel',
            type: 'config',
            filename: '.env.example',
            content: `APP_NAME=Laravel
APP_ENV=local
APP_KEY=
APP_DEBUG=true
APP_URL=http://localhost:8000

LOG_CHANNEL=stack
LOG_DEPRECATIONS_CHANNEL=null
LOG_LEVEL=debug

DB_CONNECTION=mysql
DB_HOST=mysql
DB_PORT=3306
DB_DATABASE=laravel
DB_USERNAME=laravel
DB_PASSWORD=laravel

BROADCAST_DRIVER=log
CACHE_DRIVER=redis
FILESYSTEM_DISK=local
QUEUE_CONNECTION=redis
SESSION_DRIVER=redis
SESSION_LIFETIME=120

REDIS_HOST=redis
REDIS_PASSWORD=null
REDIS_PORT=6379

MAIL_MAILER=smtp
MAIL_HOST=mailhog
MAIL_PORT=1025
MAIL_USERNAME=null
MAIL_PASSWORD=null
MAIL_ENCRYPTION=null
MAIL_FROM_ADDRESS="noreply@example.com"
MAIL_FROM_NAME="\${APP_NAME}"`,
            language: 'bash',
            tags: ['laravel', 'config', 'environment'],
            size: 0
        });
        dockerCompose.size = Buffer.byteLength(dockerCompose.content, 'utf8');
        persona.size = Buffer.byteLength(persona.content, 'utf8');
        envConfig.size = Buffer.byteLength(envConfig.content, 'utf8');
        await presetRepo.save([dockerCompose, persona, envConfig]);
        const stack = stackRepo.create({
            name: 'Laravel Fullstack',
            description: 'Stack completo para desenvolvimento Laravel com PHP 8.2, MySQL, Redis e Docker',
            technology: 'PHP/Laravel',
            color: '#FF2D20',
            icon: '🔴',
            version: '10.x',
            author: 'NetPilot',
            tags: ['laravel', 'php', 'backend', 'api', 'fullstack'],
            isActive: true,
            presets: [dockerCompose, persona, envConfig]
        });
        return await stackRepo.save(stack);
    }
    async createNextStack(stackRepo, presetRepo) {
        const dockerCompose = await presetRepo.save({
            name: 'Next.js Docker Stack',
            description: 'Docker Compose para Next.js 14 com Node 20',
            type: 'docker',
            filename: 'docker-compose.yml',
            content: `version: '3.8'

services:
  app:
    image: node:20-alpine
    container_name: nextjs-app
    working_dir: /app
    volumes:
      - ./:/app
      - /app/node_modules
    command: npm run dev
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
    networks:
      - nextjs

networks:
  nextjs:
    driver: bridge`,
            language: 'yaml',
            tags: ['nextjs', 'docker', 'node'],
            size: 0
        });
        const persona = await presetRepo.save({
            name: 'Next.js Frontend Developer',
            description: 'Persona especializada em desenvolvimento Next.js/React',
            type: 'persona',
            filename: 'frontend-developer.md',
            content: `# Persona: Next.js Frontend Developer

Você é um desenvolvedor Next.js/React sênior especializado em aplicações modernas. Sempre siga:

## TypeScript
- Use TypeScript strict mode SEMPRE
- Declare interfaces para todas as props de componentes
- Use tipos explícitos, evite 'any'
- Crie types compartilhados em /types

## Next.js 14 App Router
- Use App Router (app/) ao invés de Pages Router
- React Server Components (RSC) por padrão
- Use 'use client' apenas quando necessário (interatividade, hooks)
- Implemente loading.tsx e error.tsx em cada rota
- Use metadata API para SEO

## React Best Practices
- Componentes funcionais com hooks
- Evite prop drilling - use Context ou Zustand
- Memoize componentes pesados com React.memo
- Use useCallback para funções passadas como props
- Use useMemo para cálculos custosos

## Data Fetching
- TanStack Query (React Query) para client-side fetching
- Server Components para data fetching inicial
- Implemente cache e revalidation strategies
- Use suspense boundaries

## Estilização
- TailwindCSS como padrão
- Siga design system consistente
- Use shadcn/ui para componentes base
- Responsive design mobile-first
- Dark mode support

## Formulários e Validação
- React Hook Form para gerenciamento de formulários
- Zod para validação de schema
- Feedback visual de erros
- Debounce em inputs de busca

## Performance
- Image optimization com next/image
- Font optimization com next/font
- Code splitting automático
- Lazy loading de componentes pesados
- Minimize JavaScript bundle size

## Testes
- React Testing Library para componentes
- Jest para unit tests
- Playwright para E2E
- Mínimo 70% de cobertura

## Acessibilidade
- Componentes semânticos (header, nav, main, footer)
- ARIA labels quando necessário
- Suporte a navegação por teclado
- Contraste adequado de cores`,
            language: 'markdown',
            tags: ['nextjs', 'frontend', 'persona', 'react', 'typescript'],
            size: 0
        });
        const tsConfig = await presetRepo.save({
            name: 'TypeScript Config Strict',
            description: 'Configuração TypeScript com strict mode',
            type: 'config',
            filename: 'tsconfig.json',
            content: `{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}`,
            language: 'json',
            tags: ['nextjs', 'typescript', 'config'],
            size: 0
        });
        dockerCompose.size = Buffer.byteLength(dockerCompose.content, 'utf8');
        persona.size = Buffer.byteLength(persona.content, 'utf8');
        tsConfig.size = Buffer.byteLength(tsConfig.content, 'utf8');
        await presetRepo.save([dockerCompose, persona, tsConfig]);
        const stack = stackRepo.create({
            name: 'Next.js Fullstack',
            description: 'Stack moderno para aplicações Next.js 14 com TypeScript, TailwindCSS e Docker',
            technology: 'JavaScript/Next.js',
            color: '#000000',
            icon: '⚫',
            version: '14.x',
            author: 'NetPilot',
            tags: ['nextjs', 'react', 'frontend', 'fullstack', 'typescript'],
            isActive: true,
            presets: [dockerCompose, persona, tsConfig]
        });
        return await stackRepo.save(stack);
    }
    async createReactNativeStack(stackRepo, presetRepo) {
        const persona = await presetRepo.save({
            name: 'React Native Mobile Developer',
            description: 'Persona especializada em desenvolvimento mobile com React Native',
            type: 'persona',
            filename: 'mobile-developer.md',
            content: `# Persona: React Native Mobile Developer

Você é um desenvolvedor mobile sênior especializado em React Native. Sempre siga:

## React Native
- Use Expo quando possível para desenvolvimento rápido
- Bare workflow apenas se precisar de módulos nativos específicos
- TypeScript strict mode
- Use hooks, evite class components

## Navegação
- React Navigation v6+
- Stack Navigator para fluxos lineares
- Bottom Tabs para navegação principal
- Deep linking configurado

## Estado
- Zustand ou Redux Toolkit
- React Query para cache de API
- AsyncStorage para persistência local

## UI/UX
- Design system consistente
- Componentes reutilizáveis
- Animações com Reanimated 2
- Gestures com React Native Gesture Handler
- Feedback tátil (haptics)

## Performance
- FlatList/SectionList para listas longas
- Memoização de componentes
- Lazy loading de imagens
- Minimize re-renders

## APIs e Data
- Axios para HTTP requests
- Tratamento de offline com NetInfo
- Cache inteligente

## Testes
- Jest para unit tests
- React Native Testing Library
- Detox para E2E`,
            language: 'markdown',
            tags: ['react-native', 'mobile', 'persona', 'expo'],
            size: 0
        });
        const packageJson = await presetRepo.save({
            name: 'React Native Package Template',
            description: 'Template de package.json para React Native com Expo',
            type: 'config',
            filename: 'package.json.template',
            content: `{
  "name": "react-native-app",
  "version": "1.0.0",
  "main": "expo/AppEntry.js",
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web"
  },
  "dependencies": {
    "expo": "~49.0.0",
    "react": "18.2.0",
    "react-native": "0.72.0",
    "@react-navigation/native": "^6.0.0",
    "@react-navigation/bottom-tabs": "^6.0.0",
    "@react-navigation/native-stack": "^6.0.0",
    "zustand": "^4.0.0",
    "@tanstack/react-query": "^5.0.0"
  },
  "devDependencies": {
    "@types/react": "~18.2.0",
    "typescript": "^5.0.0"
  }
}`,
            language: 'json',
            tags: ['react-native', 'expo', 'config'],
            size: 0
        });
        persona.size = Buffer.byteLength(persona.content, 'utf8');
        packageJson.size = Buffer.byteLength(packageJson.content, 'utf8');
        await presetRepo.save([persona, packageJson]);
        const stack = stackRepo.create({
            name: 'React Native Mobile',
            description: 'Stack completo para desenvolvimento mobile com React Native e Expo',
            technology: 'JavaScript/React Native',
            color: '#61DAFB',
            icon: '📱',
            version: '0.72.x',
            author: 'NetPilot',
            tags: ['react-native', 'mobile', 'expo', 'typescript'],
            isActive: true,
            presets: [persona, packageJson]
        });
        return await stackRepo.save(stack);
    }
    async createSharedPresets(presetRepo) {
        const postgresDocker = await presetRepo.save({
            name: 'PostgreSQL Docker',
            description: 'Container Docker para PostgreSQL 16',
            type: 'docker',
            filename: 'docker-compose.postgres.yml',
            content: `version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: postgres-db
    environment:
      POSTGRES_DB: database
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - app-network

volumes:
  postgres_data:
    driver: local

networks:
  app-network:
    driver: bridge`,
            language: 'yaml',
            tags: ['postgresql', 'database', 'shared', 'docker'],
            size: 0
        });
        const redisDocker = await presetRepo.save({
            name: 'Redis Docker',
            description: 'Container Docker para Redis 7',
            type: 'docker',
            filename: 'docker-compose.redis.yml',
            content: `version: '3.8'

services:
  redis:
    image: redis:7-alpine
    container_name: redis-cache
    command: redis-server --appendonly yes
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - app-network

volumes:
  redis_data:
    driver: local

networks:
  app-network:
    driver: bridge`,
            language: 'yaml',
            tags: ['redis', 'cache', 'shared', 'docker'],
            size: 0
        });
        const nginxConfig = await presetRepo.save({
            name: 'Nginx Reverse Proxy Config',
            description: 'Configuração Nginx para proxy reverso',
            type: 'config',
            filename: 'nginx.conf',
            content: `server {
    listen 80;
    server_name localhost;

    root /var/www/public;
    index index.php index.html;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \\.php$ {
        fastcgi_pass app:9000;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\\.ht {
        deny all;
    }
}`,
            language: 'nginx',
            tags: ['nginx', 'proxy', 'shared', 'config'],
            size: 0
        });
        const gitignore = await presetRepo.save({
            name: 'Gitignore Universal',
            description: 'Template .gitignore universal para projetos',
            type: 'config',
            filename: '.gitignore',
            content: `# Dependencies
node_modules/
vendor/
.pnp
.pnp.js

# Build outputs
dist/
build/
.next/
out/

# Env files
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Testing
coverage/
.nyc_output/

# Docker
docker-compose.override.yml`,
            language: 'text',
            tags: ['git', 'shared', 'config'],
            size: 0
        });
        postgresDocker.size = Buffer.byteLength(postgresDocker.content, 'utf8');
        redisDocker.size = Buffer.byteLength(redisDocker.content, 'utf8');
        nginxConfig.size = Buffer.byteLength(nginxConfig.content, 'utf8');
        gitignore.size = Buffer.byteLength(gitignore.content, 'utf8');
        await presetRepo.save([postgresDocker, redisDocker, nginxConfig, gitignore]);
    }
}
exports.StacksPresetsSeed = StacksPresetsSeed;
exports.default = StacksPresetsSeed;
//# sourceMappingURL=stacks-presets.seed.js.map