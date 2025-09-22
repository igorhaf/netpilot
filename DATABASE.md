# 🗄️ NetPilot - Documentação do Banco de Dados

## Visão Geral

O NetPilot utiliza PostgreSQL como banco de dados principal, com suporte completo a:
- Relacionamentos complexos
- Tipos customizados (ENUMs)
- Constraints e validações
- Inicialização automática via seeds

## 📋 **Estrutura das Tabelas**

### 1. **users** - Usuários do Sistema
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR UNIQUE NOT NULL,
    password VARCHAR NOT NULL,
    role VARCHAR DEFAULT 'admin',
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Dados Iniciais:**
- Admin padrão: `admin@netpilot.local` / `admin123`

### 2. **domains** - Domínios Configurados
```sql
CREATE TABLE domains (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR UNIQUE NOT NULL,
    description TEXT,
    "isActive" BOOLEAN DEFAULT true,
    "autoTls" BOOLEAN DEFAULT true,
    "forceHttps" BOOLEAN DEFAULT true,
    "blockExternalAccess" BOOLEAN DEFAULT false,
    "enableWwwRedirect" BOOLEAN DEFAULT false,
    "bindIp" VARCHAR,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Relacionamentos:**
- `1:N` com `proxy_rules`
- `1:N` com `redirects`
- `1:N` com `ssl_certificates`

### 3. **proxy_rules** - Regras de Proxy Reverso
```sql
CREATE TABLE proxy_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "sourcePath" VARCHAR NOT NULL,
    "sourcePort" INTEGER,
    "targetUrl" VARCHAR NOT NULL,
    priority INTEGER NOT NULL,
    "isActive" BOOLEAN DEFAULT true,
    "maintainQueryStrings" BOOLEAN DEFAULT false,
    description TEXT,
    "domainId" UUID REFERENCES domains(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 4. **redirects** - Redirecionamentos
```sql
CREATE TYPE redirect_type AS ENUM ('temporary', 'permanent');

CREATE TABLE redirects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "sourcePattern" VARCHAR NOT NULL,
    "targetUrl" VARCHAR NOT NULL,
    type redirect_type NOT NULL,
    "isActive" BOOLEAN DEFAULT true,
    priority INTEGER NOT NULL,
    description TEXT,
    "domainId" UUID REFERENCES domains(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 5. **ssl_certificates** - Certificados SSL
```sql
CREATE TYPE certificate_status AS ENUM ('valid', 'expiring', 'expired', 'pending', 'failed');

CREATE TABLE ssl_certificates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "primaryDomain" VARCHAR NOT NULL,
    "sanDomains" TEXT[],
    status certificate_status DEFAULT 'pending',
    "expiresAt" TIMESTAMP,
    "autoRenew" BOOLEAN DEFAULT true,
    "renewBeforeDays" INTEGER DEFAULT 30,
    "certificatePath" VARCHAR,
    "privateKeyPath" VARCHAR,
    issuer VARCHAR,
    "lastError" TEXT,
    "domainId" UUID REFERENCES domains(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 6. **logs** - Sistema de Logs
```sql
CREATE TYPE log_type AS ENUM ('deployment', 'ssl_renewal', 'nginx_reload', 'traefik_reload', 'system');
CREATE TYPE log_status AS ENUM ('success', 'failed', 'running', 'pending');

CREATE TABLE logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type log_type NOT NULL,
    status log_status DEFAULT 'pending',
    action VARCHAR NOT NULL,
    message TEXT,
    details TEXT,
    duration INTEGER,
    "startedAt" TIMESTAMP,
    "completedAt" TIMESTAMP,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 7. **ssh_sessions** - Sessões SSH
```sql
CREATE TABLE ssh_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR NOT NULL,
    host VARCHAR NOT NULL,
    port INTEGER DEFAULT 22,
    username VARCHAR NOT NULL,
    "isActive" BOOLEAN DEFAULT false,
    "lastConnected" TIMESTAMP,
    "userId" UUID REFERENCES users(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 8. **console_logs** - Logs do Console SSH
```sql
CREATE TABLE console_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    command TEXT NOT NULL,
    output TEXT,
    "exitCode" INTEGER,
    "executedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "sessionId" UUID REFERENCES ssh_sessions(id) ON DELETE CASCADE,
    "userId" UUID REFERENCES users(id) ON DELETE CASCADE
);
```

## 🔧 **Scripts de Gerenciamento**

### Scripts Principais

| Script | Descrição | Comando |
|--------|-----------|---------|
| **init-database.sh** | Inicializa banco completo | `./scripts/init-database.sh` |
| **reset-database.sh** | Reset completo (⚠️ DESTRUTIVO) | `./scripts/reset-database.sh` |
| **seed.ts** | Executa seeds via TypeScript | `cd backend && npm run seed` |

### Via NPM (Backend)

```bash
cd backend

# Inicializar banco
npm run db:init

# Reset banco
npm run db:reset

# Executar seeds
npm run seed
```

## 📊 **Dados Iniciais (Seeds)**

### Usuário Admin
- **Email**: `admin@netpilot.local`
- **Senha**: `admin123`
- **Role**: `admin`

### Domínios de Exemplo
- `netpilot.meadadigital.com` - Domínio principal
- `example.com` - Domínio de teste
- `api.netpilot.com` - API dedicada

### Proxy Rules
- `/api/*` → `http://backend:3001`
- `/*` → `http://frontend:3000`

### Certificados SSL
- Certificados válidos por 85-90 dias
- Auto-renovação habilitada
- Issuer: Let's Encrypt

### Logs de Exemplo
- Deployments de sucesso
- Renovações SSL
- Reloads de configuração
- Falhas simuladas

## 🛠️ **Comandos Úteis**

### Verificações Rápidas

```bash
# Status das tabelas
docker-compose exec -T db psql -U netpilot -d netpilot -c "\dt"

# Contagem de registros
docker-compose exec -T db psql -U netpilot -d netpilot -c "
SELECT 'users' as tabela, count(*) as registros FROM users
UNION ALL SELECT 'domains', count(*) FROM domains
UNION ALL SELECT 'proxy_rules', count(*) FROM proxy_rules
UNION ALL SELECT 'redirects', count(*) FROM redirects
UNION ALL SELECT 'ssl_certificates', count(*) FROM ssl_certificates
UNION ALL SELECT 'logs', count(*) FROM logs
ORDER BY tabela;
"

# Verificar relacionamentos
docker-compose exec -T db psql -U netpilot -d netpilot -c "
SELECT d.name as domain,
       COUNT(pr.id) as proxy_rules,
       COUNT(r.id) as redirects,
       COUNT(ssl.id) as certificates
FROM domains d
LEFT JOIN proxy_rules pr ON d.id = pr.\"domainId\"
LEFT JOIN redirects r ON d.id = r.\"domainId\"
LEFT JOIN ssl_certificates ssl ON d.id = ssl.\"domainId\"
GROUP BY d.id, d.name;
"
```

### Backup e Restore

```bash
# Backup completo
docker-compose exec db pg_dump -U netpilot netpilot > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup apenas dados
docker-compose exec db pg_dump -U netpilot --data-only netpilot > data_backup.sql

# Restore
docker-compose exec -T db psql -U netpilot -d netpilot < backup.sql
```

### Queries de Monitoramento

```sql
-- Certificados expirando em 30 dias
SELECT "primaryDomain", "expiresAt",
       EXTRACT(days FROM "expiresAt" - CURRENT_TIMESTAMP) as days_until_expiry
FROM ssl_certificates
WHERE "expiresAt" <= CURRENT_TIMESTAMP + INTERVAL '30 days'
ORDER BY "expiresAt";

-- Logs de erro recentes
SELECT type, action, message, "createdAt"
FROM logs
WHERE status = 'failed'
ORDER BY "createdAt" DESC
LIMIT 10;

-- Domínios mais ativos (com mais proxy rules)
SELECT d.name, COUNT(pr.id) as total_rules
FROM domains d
LEFT JOIN proxy_rules pr ON d.id = pr."domainId"
WHERE d."isActive" = true
GROUP BY d.id, d.name
ORDER BY total_rules DESC;
```

## 🚨 **Troubleshooting**

### Problemas Comuns

1. **Tabelas não existem**
   ```bash
   ./scripts/init-database.sh
   ```

2. **Conexão recusada**
   - Verificar se o container `db` está rodando
   - Verificar `DATABASE_URL` no `.env`

3. **Seeds não executam**
   ```bash
   cd backend && npm run seed
   ```

4. **Reset completo necessário**
   ```bash
   ./scripts/reset-database.sh
   ```

### Logs de Debug

```bash
# Logs do banco
docker-compose logs db

# Logs do backend (conexão)
docker-compose logs backend | grep -i database

# Status dos containers
docker-compose ps
```

## 📈 **Performance e Otimização**

### Índices Recomendados

```sql
-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_domains_name ON domains(name);
CREATE INDEX IF NOT EXISTS idx_proxy_rules_domain ON proxy_rules("domainId");
CREATE INDEX IF NOT EXISTS idx_proxy_rules_priority ON proxy_rules(priority);
CREATE INDEX IF NOT EXISTS idx_ssl_certificates_domain ON ssl_certificates("domainId");
CREATE INDEX IF NOT EXISTS idx_ssl_certificates_expires ON ssl_certificates("expiresAt");
CREATE INDEX IF NOT EXISTS idx_logs_type_status ON logs(type, status);
CREATE INDEX IF NOT EXISTS idx_logs_created ON logs("createdAt");
```

### Manutenção

```sql
-- Limpar logs antigos (mais de 30 dias)
DELETE FROM logs WHERE "createdAt" < CURRENT_TIMESTAMP - INTERVAL '30 days';

-- Atualizar estatísticas
ANALYZE;

-- Verificar tamanho das tabelas
SELECT schemaname, tablename,
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```