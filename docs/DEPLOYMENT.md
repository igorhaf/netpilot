# Guia de Deployment - NetPilot

## Índice

- [Pré-requisitos](#pré-requisitos)
- [Deployment Development](#deployment-development)
- [Deployment Staging](#deployment-staging)
- [Deployment Production](#deployment-production)
- [Configurações por Ambiente](#configurações-por-ambiente)
- [SSL e Certificados](#ssl-e-certificados)
- [Backup e Restore](#backup-e-restore)
- [Monitoramento](#monitoramento)
- [Troubleshooting](#troubleshooting)
- [Rollback](#rollback)

## Pré-requisitos

### Sistema Operacional
- **Ubuntu 20.04+ / CentOS 8+ / Debian 11+**
- **Docker 20.10+**
- **Docker Compose 2.0+**
- **Git 2.30+**

### Hardware Recomendado

#### Development
- **CPU**: 2 cores
- **RAM**: 4GB
- **Storage**: 20GB SSD
- **Network**: 100Mbps

#### Staging
- **CPU**: 4 cores
- **RAM**: 8GB
- **Storage**: 100GB SSD
- **Network**: 1Gbps

#### Production
- **CPU**: 8+ cores
- **RAM**: 16GB+
- **Storage**: 500GB+ SSD NVMe
- **Network**: 1Gbps+
- **Backup**: Automático diário

### Domínios e DNS

#### Development
```
localhost:3000     # Frontend
localhost:3001     # Backend API
localhost:8080     # Traefik Dashboard
localhost:8081     # Nginx Status
```

#### Staging/Production
```
app.seudominio.com     # Frontend
api.seudominio.com     # Backend API
traefik.seudominio.com # Traefik Dashboard (protegido)
admin.seudominio.com   # Admin tools
```

## Deployment Development

### 1. Setup Local

```bash
# Clone do repositório
git clone https://github.com/seu-usuario/netpilot.git
cd netpilot

# Executar setup automático
chmod +x scripts/setup.sh
./scripts/setup.sh

# Ou setup manual
cp .env.example .env
nano .env
```

### 2. Configuração .env Development

```bash
# Ambiente
NODE_ENV=development
PORT=3001
FRONTEND_PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=netpilot_dev
DB_USER=netpilot
DB_PASS=dev_password_123

# JWT
JWT_SECRET=dev_jwt_secret_muito_forte_256_bits_aqui
JWT_REFRESH_SECRET=dev_refresh_secret_muito_forte_256_bits_aqui
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# ACME/SSL
ACME_EMAIL=dev@seudominio.com
ACME_STAGING=true
ACME_PROVIDER=letsencrypt

# URLs
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:3001
TRAEFIK_DASHBOARD_URL=http://localhost:8080

# Logs
LOG_LEVEL=debug
LOG_FILE=./logs/netpilot.log
```

### 3. Inicialização

```bash
# Build e start dos serviços
docker-compose up -d --build

# Verificar status
docker-compose ps

# Acompanhar logs
docker-compose logs -f

# Verificar saúde dos serviços
curl http://localhost:3001/health
curl http://localhost:3000/api/health
```

### 4. Desenvolvimento com Hot Reload

```bash
# Backend development
cd backend
npm install
npm run start:dev

# Frontend development (em outro terminal)
cd frontend
npm install
npm run dev
```

## Deployment Staging

### 1. Servidor Staging

```bash
# No servidor staging
git clone https://github.com/seu-usuario/netpilot.git
cd netpilot

# Checkout branch staging
git checkout staging
```

### 2. Configuração .env Staging

```bash
# Ambiente
NODE_ENV=staging
PORT=3001
FRONTEND_PORT=3000

# Database
DB_HOST=db_staging
DB_PORT=5432
DB_NAME=netpilot_staging
DB_USER=netpilot_staging
DB_PASS=staging_password_super_forte_aqui

# JWT
JWT_SECRET=staging_jwt_secret_muito_muito_forte_256_bits
JWT_REFRESH_SECRET=staging_refresh_secret_muito_muito_forte_256_bits
JWT_EXPIRES_IN=2h
JWT_REFRESH_EXPIRES_IN=7d

# ACME/SSL
ACME_EMAIL=staging@seudominio.com
ACME_STAGING=true  # Usar staging Let's Encrypt
ACME_PROVIDER=letsencrypt

# URLs
FRONTEND_URL=https://staging.seudominio.com
BACKEND_URL=https://api-staging.seudominio.com
TRAEFIK_DASHBOARD_URL=https://traefik-staging.seudominio.com

# Logs
LOG_LEVEL=info
LOG_FILE=/var/log/netpilot/netpilot.log

# Performance
DB_POOL_SIZE=10
DB_CONNECTION_TIMEOUT=30000
CACHE_TTL=300
```

### 3. Docker Compose Staging

```yaml
# docker-compose.staging.yml
version: '3.8'

services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.staging
    environment:
      - NODE_ENV=staging
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.frontend.rule=Host(`staging.seudominio.com`)"
      - "traefik.http.routers.frontend.tls.certresolver=letsencrypt"

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.staging
    environment:
      - NODE_ENV=staging
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.backend.rule=Host(`api-staging.seudominio.com`)"
      - "traefik.http.routers.backend.tls.certresolver=letsencrypt"

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: netpilot_staging
      POSTGRES_USER: netpilot_staging
      POSTGRES_PASSWORD: ${DB_PASS}
    volumes:
      - postgres_data_staging:/var/lib/postgresql/data
      - ./backups:/backups
    restart: unless-stopped

volumes:
  postgres_data_staging:
```

### 4. Deploy Staging

```bash
# Build e deploy
docker-compose -f docker-compose.staging.yml up -d --build

# Verificar SSL
curl -I https://staging.seudominio.com
curl -I https://api-staging.seudominio.com

# Executar testes de integração
npm run test:integration:staging
```

## Deployment Production

### 1. Preparação do Servidor

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Configurar firewall
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable

# Configurar logrotate
sudo tee /etc/logrotate.d/netpilot << EOF
/var/log/netpilot/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 644 root root
}
EOF
```

### 2. Configuração .env Production

```bash
# Ambiente
NODE_ENV=production
PORT=3001
FRONTEND_PORT=3000

# Database
DB_HOST=db_prod
DB_PORT=5432
DB_NAME=netpilot_production
DB_USER=netpilot_prod
DB_PASS=SENHA_SUPER_FORTE_GERADA_RANDOMICAMENTE

# JWT (usar geradores seguros)
JWT_SECRET=CHAVE_JWT_256_BITS_EXTREMAMENTE_FORTE_AQUI
JWT_REFRESH_SECRET=CHAVE_REFRESH_256_BITS_EXTREMAMENTE_FORTE_AQUI
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# ACME/SSL
ACME_EMAIL=admin@seudominio.com
ACME_STAGING=false  # PRODUCTION Let's Encrypt
ACME_PROVIDER=letsencrypt

# URLs
FRONTEND_URL=https://app.seudominio.com
BACKEND_URL=https://api.seudominio.com
TRAEFIK_DASHBOARD_URL=https://traefik.seudominio.com

# Logs
LOG_LEVEL=warn
LOG_FILE=/var/log/netpilot/netpilot.log
LOG_MAX_SIZE=100m
LOG_MAX_FILES=10

# Performance
DB_POOL_SIZE=20
DB_CONNECTION_TIMEOUT=30000
DB_IDLE_TIMEOUT=600000
CACHE_TTL=900
COMPRESSION_ENABLED=true

# Security
RATE_LIMIT_WINDOW=900000  # 15 minutes
RATE_LIMIT_MAX=100        # requests per window
CORS_ORIGINS=https://app.seudominio.com
SESSION_SECURE=true
COOKIE_SECURE=true

# Monitoring
HEALTH_CHECK_INTERVAL=30000
METRICS_ENABLED=true
PROMETHEUS_PORT=9090
```

### 3. Docker Compose Production

```yaml
# docker-compose.prod.yml
version: '3.8'

networks:
  netpilot_network:
    driver: bridge

services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
      args:
        - NODE_ENV=production
    restart: unless-stopped
    networks:
      - netpilot_network
    labels:
      - "traefik.enable=true"
      - "traefik.docker.network=netpilot_network"
      - "traefik.http.routers.frontend.rule=Host(`app.seudominio.com`)"
      - "traefik.http.routers.frontend.tls.certresolver=letsencrypt"
      - "traefik.http.routers.frontend.middlewares=security-headers"
      - "traefik.http.middlewares.security-headers.headers.forcestsheader=true"
      - "traefik.http.middlewares.security-headers.headers.sslredirect=true"

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
      args:
        - NODE_ENV=production
    restart: unless-stopped
    networks:
      - netpilot_network
    environment:
      - NODE_ENV=production
    volumes:
      - ./configs:/app/configs:ro
      - /var/log/netpilot:/var/log/netpilot
    labels:
      - "traefik.enable=true"
      - "traefik.docker.network=netpilot_network"
      - "traefik.http.routers.backend.rule=Host(`api.seudominio.com`)"
      - "traefik.http.routers.backend.tls.certresolver=letsencrypt"
      - "traefik.http.routers.backend.middlewares=api-ratelimit"
      - "traefik.http.middlewares.api-ratelimit.ratelimit.burst=50"

  db:
    image: postgres:15-alpine
    restart: unless-stopped
    networks:
      - netpilot_network
    environment:
      POSTGRES_DB: ${DB_NAME}
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASS}
      POSTGRES_INITDB_ARGS: "--encoding=UTF8 --lc-collate=en_US.UTF-8 --lc-ctype=en_US.UTF-8"
    volumes:
      - postgres_data_prod:/var/lib/postgresql/data
      - ./backups:/backups
      - ./scripts/db-init:/docker-entrypoint-initdb.d
    command: [
      "postgres",
      "-c", "max_connections=200",
      "-c", "shared_buffers=256MB",
      "-c", "effective_cache_size=1GB",
      "-c", "maintenance_work_mem=64MB",
      "-c", "checkpoint_completion_target=0.9",
      "-c", "wal_buffers=16MB",
      "-c", "default_statistics_target=100",
      "-c", "random_page_cost=1.1",
      "-c", "effective_io_concurrency=200"
    ]

  traefik:
    image: traefik:v3.0
    restart: unless-stopped
    networks:
      - netpilot_network
    ports:
      - "80:80"
      - "443:443"
      - "8080:8080"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - ./configs/traefik:/etc/traefik:ro
      - ./configs/ssl:/ssl
    command:
      - --api.dashboard=true
      - --providers.docker=true
      - --providers.docker.exposedbydefault=false
      - --entrypoints.web.address=:80
      - --entrypoints.websecure.address=:443
      - --certificatesresolvers.letsencrypt.acme.email=${ACME_EMAIL}
      - --certificatesresolvers.letsencrypt.acme.storage=/ssl/acme.json
      - --certificatesresolvers.letsencrypt.acme.httpchallenge.entrypoint=web
      - --metrics.prometheus=true
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.traefik.rule=Host(`traefik.seudominio.com`)"
      - "traefik.http.routers.traefik.tls.certresolver=letsencrypt"
      - "traefik.http.routers.traefik.middlewares=auth"
      - "traefik.http.middlewares.auth.basicauth.users=admin:$$2y$$10$$hash_da_senha"

  nginx:
    image: nginx:alpine
    restart: unless-stopped
    networks:
      - netpilot_network
    volumes:
      - ./configs/nginx:/etc/nginx/conf.d:ro
      - ./static:/var/www/static:ro
    ports:
      - "8081:80"

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    networks:
      - netpilot_network
    command: redis-server --maxmemory 256mb --maxmemory-policy allkeys-lru
    volumes:
      - redis_data_prod:/data

volumes:
  postgres_data_prod:
  redis_data_prod:
```

### 4. Deploy Production

```bash
# Preparar ambiente
sudo mkdir -p /var/log/netpilot
sudo chown $USER:$USER /var/log/netpilot

# Clone e configuração
git clone https://github.com/seu-usuario/netpilot.git
cd netpilot
git checkout main

# Configurar secrets
cp .env.example .env.prod
nano .env.prod  # Configurar todas as variáveis

# Build e deploy
docker-compose -f docker-compose.prod.yml up -d --build

# Verificar serviços
docker-compose -f docker-compose.prod.yml ps
docker-compose -f docker-compose.prod.yml logs -f

# Verificar SSL
curl -I https://app.seudominio.com
curl -I https://api.seudominio.com

# Executar testes de produção
npm run test:e2e:production
```

## Configurações por Ambiente

### Development
```bash
# .env.development
DEBUG=true
MOCK_EXTERNAL_SERVICES=true
RATE_LIMITING_DISABLED=true
SSL_VERIFICATION_DISABLED=true
LOG_LEVEL=debug
```

### Staging
```bash
# .env.staging
DEBUG=false
MOCK_EXTERNAL_SERVICES=false
RATE_LIMITING_ENABLED=true
SSL_VERIFICATION_ENABLED=true
LOG_LEVEL=info
ACME_STAGING=true
```

### Production
```bash
# .env.production
DEBUG=false
MOCK_EXTERNAL_SERVICES=false
RATE_LIMITING_ENABLED=true
SSL_VERIFICATION_ENABLED=true
LOG_LEVEL=warn
ACME_STAGING=false
SECURITY_HEADERS_ENABLED=true
```

## SSL e Certificados

### 1. Let's Encrypt Automático

```yaml
# traefik.yml
certificatesResolvers:
  letsencrypt:
    acme:
      email: admin@seudominio.com
      storage: /ssl/acme.json
      httpChallenge:
        entryPoint: web
      # Para wildcard certificates
      dnsChallenge:
        provider: cloudflare
        resolvers:
          - "1.1.1.1:53"
          - "8.8.8.8:53"
```

### 2. Certificados Customizados

```bash
# Diretório de certificados
mkdir -p configs/ssl/custom

# Copiar certificados
cp seu-certificado.crt configs/ssl/custom/
cp sua-chave-privada.key configs/ssl/custom/

# Configurar no Traefik
# configs/traefik/dynamic.yml
tls:
  certificates:
    - certFile: /ssl/custom/seu-certificado.crt
      keyFile: /ssl/custom/sua-chave-privada.key
```

### 3. Renovação Automática

```bash
# Crontab para verificação
crontab -e

# Adicionar linha para verificar renovação diariamente
0 2 * * * cd /path/to/netpilot && docker-compose exec traefik traefik healthcheck
```

## Backup e Restore

### 1. Script de Backup Automático

```bash
#!/bin/bash
# scripts/backup.sh

set -euo pipefail

BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="netpilot_backup_${DATE}"

# Criar diretório de backup
mkdir -p "${BACKUP_DIR}/${BACKUP_NAME}"

# Backup do banco de dados
docker-compose exec -T db pg_dump -U netpilot netpilot > "${BACKUP_DIR}/${BACKUP_NAME}/database.sql"

# Backup dos configs
cp -r configs/ "${BACKUP_DIR}/${BACKUP_NAME}/"

# Backup dos certificados SSL
cp -r configs/ssl/ "${BACKUP_DIR}/${BACKUP_NAME}/"

# Backup das variáveis de ambiente (sem secrets)
grep -v -E "(SECRET|PASS|TOKEN)" .env > "${BACKUP_DIR}/${BACKUP_NAME}/env_config"

# Compactar backup
cd "${BACKUP_DIR}"
tar -czf "${BACKUP_NAME}.tar.gz" "${BACKUP_NAME}/"
rm -rf "${BACKUP_NAME}/"

# Manter apenas os últimos 30 backups
find "${BACKUP_DIR}" -name "netpilot_backup_*.tar.gz" -mtime +30 -delete

echo "Backup criado: ${BACKUP_DIR}/${BACKUP_NAME}.tar.gz"
```

### 2. Configurar Backup Automático

```bash
# Tornar script executável
chmod +x scripts/backup.sh

# Agendar backup diário
crontab -e

# Adicionar linha para backup às 2h da manhã
0 2 * * * /path/to/netpilot/scripts/backup.sh >> /var/log/netpilot-backup.log 2>&1
```

### 3. Script de Restore

```bash
#!/bin/bash
# scripts/restore.sh

set -euo pipefail

if [ $# -eq 0 ]; then
    echo "Uso: $0 <arquivo_backup.tar.gz>"
    exit 1
fi

BACKUP_FILE="$1"
RESTORE_DIR="/tmp/netpilot_restore"

# Extrair backup
mkdir -p "${RESTORE_DIR}"
tar -xzf "${BACKUP_FILE}" -C "${RESTORE_DIR}"

BACKUP_NAME=$(basename "${BACKUP_FILE}" .tar.gz)
BACKUP_PATH="${RESTORE_DIR}/${BACKUP_NAME}"

# Parar serviços
docker-compose down

# Restaurar banco de dados
docker-compose up -d db
sleep 10
docker-compose exec -T db psql -U netpilot -d netpilot < "${BACKUP_PATH}/database.sql"

# Restaurar configs
cp -r "${BACKUP_PATH}/configs/" ./

# Restaurar SSL
cp -r "${BACKUP_PATH}/ssl/" ./configs/

# Reiniciar serviços
docker-compose up -d

# Limpar
rm -rf "${RESTORE_DIR}"

echo "Restore concluído com sucesso!"
```

## Monitoramento

### 1. Health Checks

```bash
#!/bin/bash
# scripts/health-check.sh

# Verificar serviços principais
check_service() {
    local service=$1
    local url=$2

    if curl -f -s "${url}/health" > /dev/null; then
        echo "✅ ${service} is healthy"
        return 0
    else
        echo "❌ ${service} is down"
        return 1
    fi
}

check_service "Frontend" "http://localhost:3000"
check_service "Backend" "http://localhost:3001"
check_service "Traefik" "http://localhost:8080"

# Verificar banco de dados
if docker-compose exec db pg_isready -U netpilot > /dev/null; then
    echo "✅ Database is healthy"
else
    echo "❌ Database is down"
fi

# Verificar certificados SSL
check_ssl() {
    local domain=$1
    local expiry=$(echo | openssl s_client -servername "${domain}" -connect "${domain}:443" 2>/dev/null | openssl x509 -noout -dates | grep "notAfter" | cut -d= -f2)
    local expiry_epoch=$(date -d "${expiry}" +%s)
    local current_epoch=$(date +%s)
    local days_until_expiry=$(( (expiry_epoch - current_epoch) / 86400 ))

    if [ "${days_until_expiry}" -lt 30 ]; then
        echo "⚠️  SSL certificate for ${domain} expires in ${days_until_expiry} days"
    else
        echo "✅ SSL certificate for ${domain} is valid (${days_until_expiry} days remaining)"
    fi
}

check_ssl "app.seudominio.com"
check_ssl "api.seudominio.com"
```

### 2. Alertas

```bash
#!/bin/bash
# scripts/alerts.sh

SLACK_WEBHOOK_URL="https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK"

send_alert() {
    local message=$1
    local severity=$2

    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"[${severity}] NetPilot Alert: ${message}\"}" \
        "${SLACK_WEBHOOK_URL}"
}

# Verificar uso de disco
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "${DISK_USAGE}" -gt 80 ]; then
    send_alert "Disk usage is at ${DISK_USAGE}%" "WARNING"
fi

# Verificar uso de memória
MEMORY_USAGE=$(free | grep Mem | awk '{print ($3/$2) * 100.0}' | cut -d. -f1)
if [ "${MEMORY_USAGE}" -gt 90 ]; then
    send_alert "Memory usage is at ${MEMORY_USAGE}%" "CRITICAL"
fi

# Verificar se todos os containers estão rodando
CONTAINERS_DOWN=$(docker-compose ps -q | wc -l)
CONTAINERS_EXPECTED=5

if [ "${CONTAINERS_DOWN}" -lt "${CONTAINERS_EXPECTED}" ]; then
    send_alert "Only ${CONTAINERS_DOWN}/${CONTAINERS_EXPECTED} containers are running" "CRITICAL"
fi
```

## Troubleshooting

### 1. Problemas Comuns

#### Serviço não inicia
```bash
# Verificar logs
docker-compose logs [service_name]

# Verificar recursos
docker stats

# Verificar portas
netstat -tulpn | grep :3000
```

#### Banco não conecta
```bash
# Verificar status do banco
docker-compose exec db pg_isready -U netpilot

# Conectar manualmente
docker-compose exec db psql -U netpilot netpilot

# Verificar logs
docker-compose logs db
```

#### SSL não funciona
```bash
# Verificar configuração Traefik
docker-compose exec traefik cat /etc/traefik/traefik.yml

# Verificar logs ACME
docker-compose logs traefik | grep acme

# Testar certificado
openssl s_client -servername app.seudominio.com -connect app.seudominio.com:443
```

### 2. Debug Mode

```bash
# Ativar modo debug
export DEBUG=true
export LOG_LEVEL=debug

# Reiniciar com logs verbosos
docker-compose down
docker-compose up --build
```

## Rollback

### 1. Rollback Rápido

```bash
#!/bin/bash
# scripts/rollback.sh

set -euo pipefail

PREVIOUS_VERSION=$1

if [ -z "${PREVIOUS_VERSION}" ]; then
    echo "Uso: $0 <versao_anterior>"
    exit 1
fi

# Parar serviços atuais
docker-compose down

# Fazer checkout da versão anterior
git checkout "${PREVIOUS_VERSION}"

# Restaurar configurações se necessário
if [ -f "backups/config_${PREVIOUS_VERSION}.tar.gz" ]; then
    tar -xzf "backups/config_${PREVIOUS_VERSION}.tar.gz"
fi

# Subir serviços com versão anterior
docker-compose up -d --build

# Verificar saúde
sleep 30
./scripts/health-check.sh

echo "Rollback para versão ${PREVIOUS_VERSION} concluído!"
```

### 2. Rollback com Restore de Banco

```bash
#!/bin/bash
# scripts/rollback-with-db.sh

set -euo pipefail

BACKUP_FILE=$1
PREVIOUS_VERSION=$2

# Executar rollback normal
./scripts/rollback.sh "${PREVIOUS_VERSION}"

# Restaurar banco de dados
./scripts/restore.sh "${BACKUP_FILE}"

echo "Rollback completo com restore de banco concluído!"
```

### 3. Blue-Green Deployment (futuro)

```yaml
# docker-compose.blue-green.yml
version: '3.8'

services:
  frontend-blue:
    build: ./frontend
    labels:
      - "traefik.http.routers.frontend-blue.rule=Host(`app.seudominio.com`) && Headers(`X-Version`, `blue`)"

  frontend-green:
    build: ./frontend
    labels:
      - "traefik.http.routers.frontend-green.rule=Host(`app.seudominio.com`) && Headers(`X-Version`, `green`)"

  # Switch traffic between blue and green
  traefik:
    command:
      - --providers.file.filename=/etc/traefik/dynamic.yml
      - --providers.file.watch=true
```

## Checklist de Deploy

### Pre-Deploy
- [ ] Backup do banco de dados
- [ ] Backup das configurações
- [ ] Verificar recursos do servidor
- [ ] Testar em staging
- [ ] Revisar variáveis de ambiente
- [ ] Verificar certificados SSL

### Deploy
- [ ] Parar serviços antigos
- [ ] Pull latest code
- [ ] Build novos containers
- [ ] Executar migrations
- [ ] Iniciar novos serviços
- [ ] Verificar health checks

### Post-Deploy
- [ ] Verificar logs de erro
- [ ] Testar funcionalidades críticas
- [ ] Verificar métricas de performance
- [ ] Confirmar SSL funcionando
- [ ] Verificar monitoramento
- [ ] Documentar mudanças

---

**⚠️ Importante**: Sempre teste deployments em ambiente de staging antes de aplicar em produção!