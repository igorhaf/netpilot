# Troubleshooting Guide - NetPilot

## Problemas Comuns e Soluções

### 1. Problemas de Conectividade

#### Database Connection Failed
```bash
# Sintomas
Error: connect ECONNREFUSED 127.0.0.1:5432
FATAL: database "netpilot" does not exist

# Soluções
# 1. Verificar se PostgreSQL está rodando
docker-compose ps

# 2. Verificar logs do banco
docker-compose logs db

# 3. Recriar banco se necessário
docker-compose down
docker-compose up -d db
docker-compose exec db createdb -U netpilot netpilot

# 4. Executar migrations
cd backend && npm run migration:run
```

#### Backend API Unreachable
```bash
# Sintomas
Cannot GET http://meadadigital.com:3001/api/docs
ERR_CONNECTION_REFUSED

# Soluções
# 1. Verificar se backend está rodando
curl http://meadadigital.com:3001/health

# 2. Verificar logs do backend
docker-compose logs backend

# 3. Verificar variáveis de ambiente
cat .env | grep -E "(DB_|PORT|JWT_)"

# 4. Restart do serviço
docker-compose restart backend
```

#### Frontend Not Loading
```bash
# Sintomas
Cannot GET http://meadadigital.com:3000
This site can't be reached

# Soluções
# 1. Verificar se frontend está rodando
curl http://meadadigital.com:3000

# 2. Verificar dependências
cd frontend && npm install

# 3. Limpar cache Next.js
cd frontend
rm -rf .next
npm run build

# 4. Verificar variáveis de ambiente
cat frontend/.env.local
```

### 2. Problemas de SSL/TLS

#### Let's Encrypt Certificate Failed
```bash
# Sintomas
SSL_ERROR_BAD_CERT_DOMAIN
Certificate is not valid for domain

# Diagnóstico
# 1. Verificar logs do Traefik
docker-compose logs traefik | grep -i acme

# 2. Verificar configuração do domínio
cat configs/traefik/dynamic.yml

# 3. Verificar DNS do domínio
nslookup example.com
dig example.com

# Soluções
# 1. Verificar se o domínio aponta para o servidor
# 2. Verificar se as portas 80 e 443 estão abertas
netstat -tulpn | grep -E ":80|:443"

# 3. Forçar renovação do certificado
docker-compose exec traefik \
  rm -rf /etc/traefik/acme/acme.json

# 4. Restart do Traefik
docker-compose restart traefik

# 5. Para desenvolvimento, usar certificados locais
# Editar configs/traefik/dynamic.yml
tls:
  options:
    default:
      minVersion: "VersionTLS12"
```

#### SSL Certificate Expired
```bash
# Sintomas
NET::ERR_CERT_DATE_INVALID
Your connection is not secure

# Diagnóstico
# 1. Verificar expiração dos certificados
openssl x509 -in configs/ssl/example.com.crt -text -noout | grep "Not After"

# 2. Verificar logs de renovação
docker-compose logs traefik | grep -i renew

# Soluções
# 1. Renovar certificados expirados via API
curl -X POST http://meadadigital.com:3001/ssl-certificates/renew

# 2. Renovação manual
docker-compose exec traefik \
  traefik --certificatesresolvers.letsencrypt.acme.caserver="https://acme-v02.api.letsencrypt.org/directory"

# 3. Configurar renovação automática (cron)
# Adicionar ao crontab do servidor:
0 2 * * * cd /path/to/netpilot && docker-compose exec traefik traefik --certificatesresolvers.letsencrypt.acme.forcerenew
```

### 3. Problemas de Proxy Reverso

#### 502 Bad Gateway
```bash
# Sintomas
502 Bad Gateway
upstream sent invalid response

# Diagnóstico
# 1. Verificar logs do Nginx
docker-compose logs nginx

# 2. Verificar configurações geradas
cat configs/nginx/sites-available/example.com.conf

# 3. Verificar se upstream está rodando
curl http://target-server:port/health

# Soluções
# 1. Verificar sintaxe do Nginx
docker-compose exec nginx nginx -t

# 2. Reload das configurações
docker-compose exec nginx nginx -s reload

# 3. Verificar conectividade com upstream
docker-compose exec nginx ping target-server

# 4. Ajustar timeout se necessário
# Em proxy-rules, adicionar:
proxy_connect_timeout 60s;
proxy_send_timeout 60s;
proxy_read_timeout 60s;
```

#### 404 Not Found for Proxied Routes
```bash
# Sintomas
404 Not Found
The requested URL was not found

# Diagnóstico
# 1. Verificar regras de proxy configuradas
curl http://meadadigital.com:3001/proxy-rules

# 2. Verificar ordem de prioridade
# Regras com maior prioridade são processadas primeiro

# 3. Verificar se o path está correto
# Para /api/* -> http://backend:3001/
# O * deve capturar corretamente

# Soluções
# 1. Ajustar prioridade das regras
# Interface: Proxy Rules -> Editar -> Prioridade

# 2. Verificar regex patterns
# Para capturar tudo: .*
# Para capturar específico: api/(.*)

# 3. Testar configuração
curl -H "Host: example.com" http://meadadigital.com/api/health
```

### 4. Problemas de Performance

#### High Memory Usage
```bash
# Sintomas
System running slow
Docker containers restarting

# Diagnóstico
# 1. Verificar uso de memória
docker stats
free -h

# 2. Verificar logs por problemas de memory leak
docker-compose logs | grep -i "out of memory"

# Soluções
# 1. Ajustar limites de memória no docker-compose.yml
services:
  backend:
    mem_limit: 512m
  frontend:
    mem_limit: 256m
  db:
    mem_limit: 1g

# 2. Otimizar queries do banco
# Adicionar índices para queries frequentes
# Usar EXPLAIN ANALYZE para queries lentas

# 3. Implementar cache
# Redis para cache de sessões e dados frequentes
```

#### Slow API Responses
```bash
# Sintomas
API responses > 5 seconds
Timeout errors in frontend

# Diagnóstico
# 1. Verificar logs de performance
docker-compose logs backend | grep -i "slow query"

# 2. Monitorar banco de dados
docker-compose exec db psql -U netpilot -c "
SELECT query, mean_time, calls
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;"

# Soluções
# 1. Otimizar queries N+1
# Usar eager loading nas relações TypeORM:
@OneToMany(() => ProxyRule, rule => rule.domain, { eager: true })

# 2. Adicionar paginação
# Para listas grandes, implementar limit/offset

# 3. Implementar cache
# Cache queries frequentes por 5-10 minutos
```

### 5. Problemas de Deploy

#### Docker Build Failed
```bash
# Sintomas
ERROR: failed to solve: process "/bin/sh -c npm install" did not complete

# Diagnóstico
# 1. Verificar espaço em disco
df -h

# 2. Verificar conectividade com registries
docker pull node:18-alpine

# 3. Verificar sintaxe do Dockerfile
docker build --no-cache -t test-image .

# Soluções
# 1. Limpar cache do Docker
docker system prune -af

# 2. Aumentar timeout de build
docker-compose build --timeout 600

# 3. Usar npm ci ao invés de npm install
RUN npm ci --only=production

# 4. Multi-stage build para otimizar
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine AS production
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
```

#### Container Keeps Restarting
```bash
# Sintomas
Container exits immediately after start
Restart loop in docker-compose ps

# Diagnóstico
# 1. Verificar logs de startup
docker-compose logs --tail=50 backend

# 2. Verificar variáveis de ambiente
docker-compose exec backend env

# 3. Verificar health check
docker-compose exec backend curl http://meadadigital.com:3001/health

# Soluções
# 1. Ajustar health check no docker-compose.yml
healthcheck:
  test: ["CMD", "curl", "-f", "http://meadadigital.com:3001/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s

# 2. Verificar dependências entre serviços
depends_on:
  db:
    condition: service_healthy

# 3. Adicionar delay para aguardar dependências
command: ["sh", "-c", "sleep 10 && npm run start:prod"]
```

### 6. Problemas de Logs

#### No Logs Appearing
```bash
# Sintomas
Empty logs section in interface
No deployment logs showing

# Diagnóstico
# 1. Verificar se logging está habilitado
docker-compose logs logs-service

# 2. Verificar banco de dados
docker-compose exec db psql -U netpilot -c "SELECT COUNT(*) FROM logs;"

# Soluções
# 1. Verificar configuração de logging
# Em config/app.config.ts:
logging: {
  level: 'debug',
  file: '/var/log/netpilot.log'
}

# 2. Restart do serviço de logs
docker-compose restart backend

# 3. Verificar permissões de escrita
chmod 666 /var/log/netpilot.log
```

#### Logs Growing Too Large
```bash
# Sintomas
Disk space running low
Large log files consuming space

# Soluções
# 1. Configurar logrotate
cat > /etc/logrotate.d/netpilot << EOF
/var/log/netpilot/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    sharedscripts
    postrotate
        docker-compose restart backend
    endscript
}
EOF

# 2. Limpar logs antigos via API
curl -X DELETE http://meadadigital.com:3001/logs/clear?olderThan=7days

# 3. Configurar retenção automática
# No banco, adicionar job para deletar logs > 30 dias
```

### 7. Problemas de Desenvolvimento

#### Hot Reload Not Working
```bash
# Sintomas
Changes not reflecting in development
Need to restart constantly

# Soluções Frontend
# 1. Verificar se fast refresh está habilitado
# next.config.js:
module.exports = {
  reactStrictMode: true,
  swcMinify: true,
}

# 2. Limpar cache
rm -rf .next
npm run dev

# Soluções Backend
# 1. Verificar se nodemon está configurado
# package.json:
"start:dev": "nest start --watch"

# 2. Verificar volumes no docker-compose
volumes:
  - ./backend/src:/app/src
  - /app/node_modules
```

#### TypeScript Compilation Errors
```bash
# Sintomas
Type errors in development
Build failing due to types

# Soluções
# 1. Verificar configuração do TypeScript
cat tsconfig.json

# 2. Atualizar tipos
npm install --save-dev @types/node @types/express

# 3. Verificar imports
# Usar imports relativos ou configurar paths

# 4. Restart do TypeScript server (VSCode)
Ctrl+Shift+P -> "TypeScript: Restart TS Server"
```

## Scripts de Diagnóstico

### Verificação Completa do Sistema
```bash
#!/bin/bash
# scripts/health-check.sh

echo "=== NetPilot Health Check ==="

# Verificar serviços
echo "1. Checking services..."
docker-compose ps

# Verificar conectividade
echo "2. Checking connectivity..."
curl -f http://meadadigital.com:3000 || echo "Frontend DOWN"
curl -f http://meadadigital.com:3001/health || echo "Backend DOWN"
curl -f http://meadadigital.com:8080 || echo "Traefik DOWN"

# Verificar banco
echo "3. Checking database..."
docker-compose exec db pg_isready -U netpilot || echo "Database DOWN"

# Verificar certificados
echo "4. Checking SSL certificates..."
docker-compose exec traefik ls -la /etc/traefik/acme/

# Verificar logs recentes
echo "5. Recent errors..."
docker-compose logs --tail=10 | grep -i error

echo "=== Health Check Complete ==="
```

### Reset Completo do Sistema
```bash
#!/bin/bash
# scripts/reset-system.sh

echo "=== WARNING: This will reset ALL data ==="
read -p "Are you sure? (yes/no): " confirm

if [ "$confirm" = "yes" ]; then
    echo "Stopping all services..."
    docker-compose down -v

    echo "Removing all data..."
    docker system prune -af
    rm -rf configs/ssl/certificates/*
    rm -rf data/postgres/*

    echo "Rebuilding..."
    docker-compose up -d --build

    echo "Running migrations..."
    sleep 30
    docker-compose exec backend npm run migration:run

    echo "Running seeds..."
    docker-compose exec backend npm run seed

    echo "System reset complete!"
fi
```

## Monitoring e Alertas

### Configurar Monitoramento Básico
```bash
# Verificar recursos do sistema
watch "docker stats --no-stream"

# Monitorar logs em tempo real
docker-compose logs -f | grep -E "(ERROR|WARN|FATAL)"

# Verificar saúde dos serviços
while true; do
  curl -f http://meadadigital.com:3001/health || echo "$(date): Backend DOWN"
  sleep 60
done
```

### Alertas por Email (Futuro)
```typescript
// Implementar em logs.service.ts
async sendAlert(error: any) {
  if (error.level === 'FATAL') {
    await this.emailService.send({
      to: 'admin@netpilot.local',
      subject: 'NetPilot Fatal Error',
      body: `Error: ${error.message}\nTime: ${error.timestamp}`
    });
  }
}
```

## Contato e Suporte

### Canais de Suporte
- **Issues**: GitHub Issues para bugs e features
- **Documentação**: `/docs` para guias técnicos
- **Logs**: Sempre incluir logs completos nos reports

### Informações para Reportar Bugs
```bash
# Coletar informações do sistema
echo "=== Bug Report Info ==="
echo "OS: $(uname -a)"
echo "Docker: $(docker --version)"
echo "Compose: $(docker-compose --version)"
echo "Services: $(docker-compose ps)"
echo "Logs: $(docker-compose logs --tail=50)"
```

---

**Dica**: Mantenha sempre um backup antes de fazer mudanças significativas no sistema.