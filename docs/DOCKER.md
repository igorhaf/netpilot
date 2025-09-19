# Docker Documentation - NetPilot

## Visão Geral

O NetPilot é totalmente containerizado usando Docker e Docker Compose, facilitando o deployment e a manutenção do sistema de proxy reverso.

## Arquitetura de Containers

### Diagrama da Arquitetura
```
                    ┌──────────────────────────────────────────┐
                    │                Internet                   │
                    └────────────────┬─────────────────────────┘
                                     │
                         ┌──────────▼───────────┐
                         │       Traefik        │ :80, :443, :8080
                         │   (Load Balancer)    │
                         └──────────┬───────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
         ┌─────────▼────────┐ ┌────▼────────┐ ┌───▼──────────┐
         │     Frontend     │ │   Backend   │ │    Nginx     │
         │   (Next.js)      │ │  (NestJS)   │ │ (Web Server) │
         │     :3000        │ │    :3001    │ │    :8081     │
         └──────────────────┘ └─────┬───────┘ └──────────────┘
                                    │
                         ┌─────────▼───────────┐
                         │    PostgreSQL       │
                         │    (Database)       │ :5432
                         └─────────────────────┘

Networks:
- netpilot-public  (frontend, traefik)
- netpilot-internal (backend, db, nginx)
- netpilot-api     (frontend, backend)
```

## Containers e Serviços

### 1. Traefik (Load Balancer)

```dockerfile
# Não usa Dockerfile personalizado, usa imagem oficial
services:
  traefik:
    image: traefik:v3.0
    container_name: netpilot-traefik
    restart: unless-stopped
```

**Função:**
- Proxy reverso principal
- Terminação SSL/TLS
- Load balancing
- Dashboard de monitoramento

**Portas:**
- `80`: HTTP (redirecionamento para HTTPS)
- `443`: HTTPS (tráfego principal)
- `8080`: Dashboard do Traefik

**Volumes:**
- `./configs/traefik:/etc/traefik:ro`
- `./configs/ssl:/etc/ssl/certs`
- `/var/run/docker.sock:/var/run/docker.sock:ro`

### 2. Backend (NestJS API)

```dockerfile
# backend/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM node:18-alpine AS production

WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

EXPOSE 3001

USER node

CMD ["node", "dist/main.js"]
```

**Função:**
- API REST para gerenciamento
- Autenticação JWT
- Geração de configurações Nginx/Traefik
- Gerenciamento SSL

**Portas:**
- `3001`: API HTTP

**Volumes:**
- `./configs:/app/configs`
- `./data/logs:/app/logs`

### 3. Frontend (Next.js)

```dockerfile
# frontend/Dockerfile
FROM node:18-alpine AS dependencies

WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:18-alpine AS builder

WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:18-alpine AS production

WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
```

**Função:**
- Interface web do usuário
- Dashboard de monitoramento
- Formulários de configuração

**Portas:**
- `3000`: Interface web

### 4. PostgreSQL (Database)

```dockerfile
# Usa imagem oficial PostgreSQL
services:
  db:
    image: postgres:15-alpine
```

**Função:**
- Armazenamento de configurações
- Logs do sistema
- Dados de usuários

**Portas:**
- `5432`: PostgreSQL (apenas rede interna)

**Volumes:**
- `postgres_data:/var/lib/postgresql/data`
- `./configs/postgres:/docker-entrypoint-initdb.d`

### 5. Nginx (Web Server)

```dockerfile
# nginx/Dockerfile
FROM nginx:alpine

COPY nginx.conf /etc/nginx/nginx.conf
COPY sites-available/ /etc/nginx/sites-available/
COPY ssl/ /etc/nginx/ssl/

RUN mkdir -p /etc/nginx/sites-enabled

EXPOSE 8081

CMD ["nginx", "-g", "daemon off;"]
```

**Função:**
- Servidor web secundário
- Proxy reverso configurável
- Servidor de arquivos estáticos

**Portas:**
- `8081`: HTTP/HTTPS

**Volumes:**
- `./configs/nginx:/etc/nginx`
- `./configs/ssl:/etc/nginx/ssl`

## Docker Compose

### docker-compose.yml (Desenvolvimento)

```yaml
version: '3.8'

services:
  traefik:
    image: traefik:v3.0
    container_name: netpilot-traefik
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
      - "8080:8080"
    volumes:
      - ./configs/traefik:/etc/traefik:ro
      - ./configs/ssl:/etc/ssl/certs
      - /var/run/docker.sock:/var/run/docker.sock:ro
    networks:
      - netpilot-public
      - netpilot-internal
    environment:
      - TRAEFIK_API_DASHBOARD=true
      - TRAEFIK_API_INSECURE=true # Apenas desenvolvimento
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.traefik.rule=Host(`traefik.meadadigital.com`)"
      - "traefik.http.routers.traefik.service=api@internal"

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
      target: development # Target específico para dev
    container_name: netpilot-backend
    restart: unless-stopped
    ports:
      - "3001:3001"
    volumes:
      - ./backend/src:/app/src # Hot reload
      - ./configs:/app/configs
      - ./data/logs:/app/logs
    networks:
      - netpilot-internal
      - netpilot-api
    environment:
      - NODE_ENV=development
      - DB_HOST=db
      - DB_PORT=5432
      - DB_USERNAME=${DB_USERNAME}
      - DB_PASSWORD=${DB_PASSWORD}
      - DB_NAME=${DB_NAME}
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      db:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://meadadigital.com:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.backend.rule=Host(`api.meadadigital.com`)"
      - "traefik.http.routers.backend.tls=true"

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      target: development
    container_name: netpilot-frontend
    restart: unless-stopped
    ports:
      - "3000:3000"
    volumes:
      - ./frontend/src:/app/src # Hot reload
    networks:
      - netpilot-public
      - netpilot-api
    environment:
      - NODE_ENV=development
      - NEXT_PUBLIC_API_URL=http://meadadigital.com:3001
    depends_on:
      - backend
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.frontend.rule=Host(`meadadigital.com`)"
      - "traefik.http.routers.frontend.tls=true"

  nginx:
    build:
      context: ./nginx
      dockerfile: Dockerfile
    container_name: netpilot-nginx
    restart: unless-stopped
    ports:
      - "8081:8081"
    volumes:
      - ./configs/nginx:/etc/nginx:ro
      - ./configs/ssl:/etc/nginx/ssl:ro
    networks:
      - netpilot-internal
    depends_on:
      - backend
    healthcheck:
      test: ["CMD", "curl", "-f", "http://meadadigital.com:8081/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  db:
    image: postgres:15-alpine
    container_name: netpilot-db
    restart: unless-stopped
    ports:
      - "5432:5432" # Apenas desenvolvimento
    environment:
      POSTGRES_DB: ${DB_NAME}
      POSTGRES_USER: ${DB_USERNAME}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_INITDB_ARGS: "--auth-host=md5"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./configs/postgres:/docker-entrypoint-initdb.d:ro
    networks:
      - netpilot-internal
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USERNAME} -d ${DB_NAME}"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 30s

volumes:
  postgres_data:
    driver: local

networks:
  netpilot-public:
    driver: bridge
  netpilot-internal:
    driver: bridge
  netpilot-api:
    driver: bridge
```

### docker-compose.prod.yml (Produção)

```yaml
version: '3.8'

services:
  traefik:
    image: traefik:v3.0
    container_name: netpilot-traefik-prod
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./configs/traefik:/etc/traefik:ro
      - ./configs/ssl:/etc/ssl/certs
      - /var/run/docker.sock:/var/run/docker.sock:ro
    networks:
      - netpilot-public
      - netpilot-internal
    environment:
      - TRAEFIK_API_DASHBOARD=false # Desabilitado em produção
      - ACME_STAGING=${ACME_STAGING:-false}
    deploy:
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
      target: production
    container_name: netpilot-backend-prod
    restart: unless-stopped
    volumes:
      - ./configs:/app/configs:ro
      - ./data/logs:/app/logs
    networks:
      - netpilot-internal
      - netpilot-api
    environment:
      - NODE_ENV=production
      - DB_HOST=db
      - DB_PORT=5432
      - DB_USERNAME_FILE=/run/secrets/db_username
      - DB_PASSWORD_FILE=/run/secrets/db_password
      - DB_NAME=${DB_NAME}
      - JWT_SECRET_FILE=/run/secrets/jwt_secret
    secrets:
      - db_username
      - db_password
      - jwt_secret
    depends_on:
      db:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://meadadigital.com:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    deploy:
      resources:
        limits:
          memory: 1G
        reservations:
          memory: 512M

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      target: production
    container_name: netpilot-frontend-prod
    restart: unless-stopped
    networks:
      - netpilot-public
      - netpilot-api
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=${API_URL}
    depends_on:
      - backend
    deploy:
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M

  nginx:
    build:
      context: ./nginx
      dockerfile: Dockerfile
    container_name: netpilot-nginx-prod
    restart: unless-stopped
    volumes:
      - ./configs/nginx:/etc/nginx:ro
      - ./configs/ssl:/etc/nginx/ssl:ro
    networks:
      - netpilot-internal
    depends_on:
      - backend
    healthcheck:
      test: ["CMD", "curl", "-f", "http://meadadigital.com:8081/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    deploy:
      resources:
        limits:
          memory: 256M
        reservations:
          memory: 128M

  db:
    image: postgres:15-alpine
    container_name: netpilot-db-prod
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${DB_NAME}
      POSTGRES_USER_FILE: /run/secrets/db_username
      POSTGRES_PASSWORD_FILE: /run/secrets/db_password
    secrets:
      - db_username
      - db_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./configs/postgres:/docker-entrypoint-initdb.d:ro
    networks:
      - netpilot-internal
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $(cat /run/secrets/db_username) -d ${DB_NAME}"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 30s
    deploy:
      resources:
        limits:
          memory: 2G
        reservations:
          memory: 1G

secrets:
  db_username:
    external: true
  db_password:
    external: true
  jwt_secret:
    external: true

volumes:
  postgres_data:
    driver: local

networks:
  netpilot-public:
    driver: bridge
  netpilot-internal:
    driver: bridge
    internal: true # Rede interna apenas
  netpilot-api:
    driver: bridge
```

## Comandos Docker Úteis

### Build e Deploy
```bash
# Build para desenvolvimento
docker-compose build

# Build sem cache
docker-compose build --no-cache

# Build específico
docker-compose build backend

# Deploy desenvolvimento
docker-compose up -d

# Deploy produção
docker-compose -f docker-compose.prod.yml up -d --build

# Deploy com rebuild
docker-compose up -d --build
```

### Monitoramento
```bash
# Status dos containers
docker-compose ps

# Logs de todos os serviços
docker-compose logs -f

# Logs específicos
docker-compose logs -f backend
docker-compose logs -f --tail=100 traefik

# Estatísticas de recursos
docker stats

# Informações detalhadas
docker-compose top
docker-compose config
```

### Manutenção
```bash
# Parar serviços
docker-compose stop

# Reiniciar serviços
docker-compose restart

# Reiniciar específico
docker-compose restart backend

# Remover containers
docker-compose down

# Remover com volumes
docker-compose down -v

# Limpeza completa
docker system prune -af
docker volume prune -f
```

### Backup e Restore
```bash
# Backup volumes
docker run --rm -v netpilot_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_backup.tar.gz -C /data .

# Restore volumes
docker run --rm -v netpilot_postgres_data:/data -v $(pwd):/backup alpine sh -c "cd /data && tar xzf /backup/postgres_backup.tar.gz"

# Backup configurações
tar czf configs_backup.tar.gz configs/

# Export/Import images
docker save netpilot-backend:latest | gzip > netpilot-backend.tar.gz
docker load < netpilot-backend.tar.gz
```

## Multi-Stage Builds

### Backend Otimizado
```dockerfile
# backend/Dockerfile
FROM node:18-alpine AS base
WORKDIR /app
COPY package*.json ./

FROM base AS dependencies
RUN npm ci

FROM base AS build
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
RUN npm run build && npm prune --production

FROM node:18-alpine AS production
WORKDIR /app

RUN addgroup --system --gid 1001 nestjs
RUN adduser --system --uid 1001 nestjs

COPY --from=build --chown=nestjs:nestjs /app/dist ./dist
COPY --from=build --chown=nestjs:nestjs /app/node_modules ./node_modules
COPY --from=build --chown=nestjs:nestjs /app/package.json ./

USER nestjs

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://meadadigital.com:3001/health || exit 1

CMD ["node", "dist/main.js"]

FROM base AS development
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
EXPOSE 3001
CMD ["npm", "run", "start:dev"]
```

### Frontend Otimizado
```dockerfile
# frontend/Dockerfile
FROM node:18-alpine AS base
WORKDIR /app

FROM base AS dependencies
COPY package*.json ./
RUN npm ci

FROM base AS build
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:18-alpine AS production
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=build /app/public ./public
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://meadadigital.com:3000/api/health || exit 1

CMD ["node", "server.js"]

FROM base AS development
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]
```

## Segurança

### Best Practices
```dockerfile
# 1. Usar usuário não-root
RUN addgroup --system --gid 1001 appgroup
RUN adduser --system --uid 1001 appuser
USER appuser

# 2. Usar imagens Alpine (menores)
FROM node:18-alpine

# 3. Multi-stage para reduzir tamanho
FROM node:18-alpine AS builder
# ... build steps
FROM node:18-alpine AS production
COPY --from=builder /app/dist ./dist

# 4. Health checks
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD curl -f http://meadadigital.com:3001/health || exit 1

# 5. Não expor portas desnecessárias
# EXPOSE apenas o que for necessário

# 6. Labels para metadados
LABEL maintainer="netpilot@example.com"
LABEL version="1.0.0"
LABEL description="NetPilot Backend API"
```

### Secrets em Produção
```bash
# Criar secrets
echo "super_secret_jwt_key" | docker secret create jwt_secret -
echo "postgres_username" | docker secret create db_username -
echo "postgres_password" | docker secret create db_password -

# Listar secrets
docker secret ls

# Remover secrets
docker secret rm jwt_secret
```

## Performance

### Otimizações
```yaml
# Limites de recursos
deploy:
  resources:
    limits:
      memory: 1G
      cpus: '0.5'
    reservations:
      memory: 512M
      cpus: '0.25'

# Cache de layers
RUN npm ci --only=production

# Build cache
COPY package*.json ./
RUN npm ci
COPY . .

# Volumes compartilhados apenas quando necessário
volumes:
  - ./configs:/app/configs:ro # read-only
```

## Troubleshooting

### Problemas Comuns

#### Container não inicia
```bash
# Verificar logs
docker-compose logs backend

# Verificar configuração
docker-compose config

# Verificar health check
docker inspect netpilot-backend | grep -A 10 Health
```

#### Problemas de rede
```bash
# Listar redes
docker network ls

# Inspecionar rede
docker network inspect netpilot_netpilot-internal

# Teste de conectividade
docker-compose exec backend ping db
docker-compose exec backend curl http://db:5432
```

#### Build falha
```bash
# Build com logs detalhados
docker-compose build --no-cache --progress=plain backend

# Verificar espaço em disco
df -h

# Limpar cache
docker system prune -af
```

#### Performance lenta
```bash
# Verificar recursos
docker stats

# Verificar logs de erro
docker-compose logs | grep -i error

# Verificar health checks
docker-compose ps
```

---

**Nota**: Sempre use os comandos de produção (`docker-compose.prod.yml`) em ambientes de produção e development (`docker-compose.yml`) apenas para desenvolvimento local.