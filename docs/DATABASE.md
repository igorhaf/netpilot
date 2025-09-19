# Database Documentation - NetPilot

## Visão Geral

O NetPilot utiliza PostgreSQL como banco de dados principal para armazenar configurações de domínios, regras de proxy, certificados SSL e logs do sistema.

## Schema do Banco de Dados

### Diagrama de Relacionamentos (ASCII)

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│      users      │    │     domains     │    │   proxy_rules   │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ id (UUID) PK    │    │ id (UUID) PK    │    │ id (UUID) PK    │
│ email           │    │ name            │    │ domain_id FK    │
│ password_hash   │    │ description     │    │ origin_path     │
│ roles           │    │ enabled         │    │ destination_url │
│ created_at      │    │ auto_ssl        │    │ priority        │
│ updated_at      │    │ force_https     │    │ enabled         │
└─────────────────┘    │ block_external  │    │ created_at      │
                       │ www_redirect    │    │ updated_at      │
                       │ created_at      │    └─────────────────┘
                       │ updated_at      │           │
                       └─────────────────┘           │
                              │                      │
                              │ 1:N                  │
                              ▼                      │
                       ┌─────────────────┐           │
                       │    redirects    │           │
                       ├─────────────────┤           │
                       │ id (UUID) PK    │           │
                       │ domain_id FK    │───────────┘
                       │ origin_path     │
                       │ destination_url │
                       │ redirect_type   │
                       │ enabled         │
                       │ created_at      │
                       │ updated_at      │
                       └─────────────────┘
                              │
                              │ 1:N
                              ▼
                    ┌─────────────────────┐
                    │  ssl_certificates   │
                    ├─────────────────────┤
                    │ id (UUID) PK        │
                    │ domain_id FK        │
                    │ domain_name         │
                    │ san_domains         │
                    │ certificate_path    │
                    │ private_key_path    │
                    │ expires_at          │
                    │ auto_renew          │
                    │ status              │
                    │ created_at          │
                    │ updated_at          │
                    └─────────────────────┘

┌─────────────────┐
│      logs       │
├─────────────────┤
│ id (UUID) PK    │
│ type            │
│ action          │
│ status          │
│ message         │
│ details         │
│ user_id FK      │
│ domain_id FK    │
│ started_at      │
│ completed_at    │
│ duration        │
│ created_at      │
└─────────────────┘
```

## Entidades e Relacionamentos

### 1. Users (Usuários)

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    roles TEXT[] DEFAULT ARRAY['user'],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_roles ON users USING GIN(roles);
```

**Campos:**
- `id`: Identificador único (UUID)
- `email`: Email do usuário (único)
- `password_hash`: Hash da senha (bcrypt)
- `roles`: Array de roles (`['admin', 'user']`)
- `created_at`: Data de criação
- `updated_at`: Data de atualização

### 2. Domains (Domínios)

```sql
CREATE TABLE domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(253) UNIQUE NOT NULL,
    description TEXT,
    enabled BOOLEAN DEFAULT true,
    auto_ssl BOOLEAN DEFAULT true,
    force_https BOOLEAN DEFAULT true,
    block_external BOOLEAN DEFAULT false,
    www_redirect BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_domains_name ON domains(name);
CREATE INDEX idx_domains_enabled ON domains(enabled);
CREATE INDEX idx_domains_auto_ssl ON domains(auto_ssl);
```

**Campos:**
- `id`: Identificador único
- `name`: Nome do domínio (ex: example.com)
- `description`: Descrição opcional
- `enabled`: Se o domínio está ativo
- `auto_ssl`: SSL automático via Let's Encrypt
- `force_https`: Forçar redirecionamento HTTPS
- `block_external`: Bloquear acesso externo
- `www_redirect`: Redirecionamento WWW

### 3. Proxy Rules (Regras de Proxy)

```sql
CREATE TABLE proxy_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain_id UUID NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
    origin_path VARCHAR(500) NOT NULL,
    destination_url VARCHAR(500) NOT NULL,
    priority INTEGER DEFAULT 100,
    enabled BOOLEAN DEFAULT true,
    keep_query_strings BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_proxy_rules_domain_id ON proxy_rules(domain_id);
CREATE INDEX idx_proxy_rules_priority ON proxy_rules(priority DESC);
CREATE INDEX idx_proxy_rules_enabled ON proxy_rules(enabled);
CREATE INDEX idx_proxy_rules_origin_path ON proxy_rules(origin_path);

-- Índice composto para performance de matching
CREATE INDEX idx_proxy_rules_domain_path ON proxy_rules(domain_id, origin_path, priority DESC);
```

**Campos:**
- `id`: Identificador único
- `domain_id`: Referência ao domínio
- `origin_path`: Caminho de origem (ex: `/api/*`)
- `destination_url`: URL de destino (ex: `http://backend:3001/`)
- `priority`: Prioridade de matching (maior = primeira)
- `enabled`: Se a regra está ativa
- `keep_query_strings`: Manter query strings

### 4. Redirects (Redirecionamentos)

```sql
CREATE TABLE redirects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain_id UUID NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
    origin_path VARCHAR(500) NOT NULL,
    destination_url VARCHAR(500) NOT NULL,
    redirect_type INTEGER DEFAULT 301,
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_redirects_domain_id ON redirects(domain_id);
CREATE INDEX idx_redirects_enabled ON redirects(enabled);
CREATE INDEX idx_redirects_origin_path ON redirects(origin_path);

-- Constraint para tipos de redirect válidos
ALTER TABLE redirects ADD CONSTRAINT chk_redirect_type
    CHECK (redirect_type IN (301, 302, 307, 308));
```

**Campos:**
- `id`: Identificador único
- `domain_id`: Referência ao domínio
- `origin_path`: Caminho de origem
- `destination_url`: URL de destino
- `redirect_type`: Tipo de redirect (301, 302, 307, 308)
- `enabled`: Se o redirect está ativo

### 5. SSL Certificates (Certificados SSL)

```sql
CREATE TABLE ssl_certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain_id UUID NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
    domain_name VARCHAR(253) NOT NULL,
    san_domains TEXT[] DEFAULT ARRAY[]::TEXT[],
    certificate_path VARCHAR(500),
    private_key_path VARCHAR(500),
    expires_at TIMESTAMP WITH TIME ZONE,
    auto_renew BOOLEAN DEFAULT true,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_ssl_certificates_domain_id ON ssl_certificates(domain_id);
CREATE INDEX idx_ssl_certificates_domain_name ON ssl_certificates(domain_name);
CREATE INDEX idx_ssl_certificates_expires_at ON ssl_certificates(expires_at);
CREATE INDEX idx_ssl_certificates_status ON ssl_certificates(status);
CREATE INDEX idx_ssl_certificates_auto_renew ON ssl_certificates(auto_renew);

-- Índice GIN para SAN domains
CREATE INDEX idx_ssl_certificates_san_domains ON ssl_certificates USING GIN(san_domains);

-- Constraint para status válidos
ALTER TABLE ssl_certificates ADD CONSTRAINT chk_ssl_status
    CHECK (status IN ('pending', 'issued', 'expired', 'revoked', 'failed'));
```

**Campos:**
- `id`: Identificador único
- `domain_id`: Referência ao domínio
- `domain_name`: Domínio principal do certificado
- `san_domains`: Domínios alternativos (SAN)
- `certificate_path`: Caminho do arquivo do certificado
- `private_key_path`: Caminho da chave privada
- `expires_at`: Data de expiração
- `auto_renew`: Renovação automática
- `status`: Status do certificado

### 6. Logs (Sistema de Logs)

```sql
CREATE TABLE logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(50) NOT NULL,
    action VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL,
    message TEXT,
    details JSONB,
    user_id UUID REFERENCES users(id),
    domain_id UUID REFERENCES domains(id),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    duration INTEGER, -- em milissegundos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_logs_type ON logs(type);
CREATE INDEX idx_logs_action ON logs(action);
CREATE INDEX idx_logs_status ON logs(status);
CREATE INDEX idx_logs_started_at ON logs(started_at DESC);
CREATE INDEX idx_logs_user_id ON logs(user_id);
CREATE INDEX idx_logs_domain_id ON logs(domain_id);

-- Índice GIN para busca em JSONB
CREATE INDEX idx_logs_details ON logs USING GIN(details);

-- Índice composto para queries de dashboard
CREATE INDEX idx_logs_type_status_started ON logs(type, status, started_at DESC);
```

**Campos:**
- `id`: Identificador único
- `type`: Tipo de log (`deployment`, `system`, `security`, `ssl`)
- `action`: Ação executada (`create_domain`, `renew_ssl`, etc.)
- `status`: Status (`success`, `running`, `failed`, `cancelled`)
- `message`: Mensagem descritiva
- `details`: Detalhes adicionais em JSON
- `user_id`: Usuário que executou a ação
- `domain_id`: Domínio relacionado (se aplicável)
- `started_at`: Início da ação
- `completed_at`: Fim da ação
- `duration`: Duração em milissegundos

## Queries Comuns

### 1. Listar Domínios com Regras de Proxy
```sql
SELECT
    d.id,
    d.name,
    d.description,
    d.enabled,
    COUNT(pr.id) as proxy_rules_count,
    COUNT(r.id) as redirects_count
FROM domains d
LEFT JOIN proxy_rules pr ON d.id = pr.domain_id AND pr.enabled = true
LEFT JOIN redirects r ON d.id = r.domain_id AND r.enabled = true
WHERE d.enabled = true
GROUP BY d.id, d.name, d.description, d.enabled
ORDER BY d.created_at DESC;
```

### 2. Certificados Expirando em 30 Dias
```sql
SELECT
    sc.id,
    sc.domain_name,
    sc.san_domains,
    sc.expires_at,
    (sc.expires_at - NOW()) as time_until_expiry,
    d.name as domain_name,
    d.auto_ssl
FROM ssl_certificates sc
JOIN domains d ON sc.domain_id = d.id
WHERE sc.status = 'issued'
  AND sc.expires_at <= NOW() + INTERVAL '30 days'
  AND sc.expires_at > NOW()
ORDER BY sc.expires_at ASC;
```

### 3. Logs de Deployment Recentes
```sql
SELECT
    l.id,
    l.type,
    l.action,
    l.status,
    l.message,
    l.started_at,
    l.completed_at,
    l.duration,
    u.email as user_email,
    d.name as domain_name
FROM logs l
LEFT JOIN users u ON l.user_id = u.id
LEFT JOIN domains d ON l.domain_id = d.id
WHERE l.type = 'deployment'
  AND l.started_at >= NOW() - INTERVAL '7 days'
ORDER BY l.started_at DESC
LIMIT 50;
```

### 4. Performance de Proxy Rules
```sql
-- Query para verificar regras de proxy mais utilizadas
SELECT
    pr.id,
    pr.origin_path,
    pr.destination_url,
    pr.priority,
    d.name as domain_name,
    COUNT(l.id) as usage_count
FROM proxy_rules pr
JOIN domains d ON pr.domain_id = d.id
LEFT JOIN logs l ON l.details->>'proxy_rule_id' = pr.id::text
WHERE pr.enabled = true
  AND l.created_at >= NOW() - INTERVAL '30 days'
GROUP BY pr.id, pr.origin_path, pr.destination_url, pr.priority, d.name
ORDER BY usage_count DESC;
```

## Migrations

### Estrutura de Migrations
```sql
-- 001_create_users_table.sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    roles TEXT[] DEFAULT ARRAY['user'],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger para updated_at automático
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Seeds Iniciais
```sql
-- seeds/001_initial_user.sql
INSERT INTO users (email, password_hash, roles) VALUES
('admin@netpilot.local', '$2b$12$hashaqui', ARRAY['admin', 'user'])
ON CONFLICT (email) DO NOTHING;

-- seeds/002_example_domain.sql
INSERT INTO domains (name, description, enabled, auto_ssl) VALUES
('netpilot.local', 'Domínio principal do NetPilot', true, false)
ON CONFLICT (name) DO NOTHING;
```

## Backup e Recovery

### Backup Automático
```bash
#!/bin/bash
# scripts/backup-db.sh

BACKUP_DIR="/backup/netpilot"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="netpilot"

# Criar diretório de backup
mkdir -p $BACKUP_DIR

# Backup completo
docker-compose exec -T db pg_dump -U netpilot -Fc $DB_NAME > $BACKUP_DIR/netpilot_full_$DATE.dump

# Backup apenas schema
docker-compose exec -T db pg_dump -U netpilot -s $DB_NAME > $BACKUP_DIR/netpilot_schema_$DATE.sql

# Backup apenas dados
docker-compose exec -T db pg_dump -U netpilot -a $DB_NAME > $BACKUP_DIR/netpilot_data_$DATE.sql

# Comprimir backups antigos
find $BACKUP_DIR -name "*.dump" -mtime +7 -exec gzip {} \;

# Remover backups muito antigos
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_DIR/netpilot_full_$DATE.dump"
```

### Recovery
```bash
#!/bin/bash
# scripts/restore-db.sh

BACKUP_FILE="$1"

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: $0 <backup_file>"
    exit 1
fi

echo "WARNING: This will overwrite the current database!"
read -p "Are you sure? (yes/no): " confirm

if [ "$confirm" = "yes" ]; then
    # Parar aplicação
    docker-compose stop backend frontend

    # Restaurar banco
    docker-compose exec -T db dropdb -U netpilot netpilot
    docker-compose exec -T db createdb -U netpilot netpilot
    docker-compose exec -T db pg_restore -U netpilot -d netpilot < $BACKUP_FILE

    # Reiniciar aplicação
    docker-compose start backend frontend

    echo "Database restored successfully"
else
    echo "Restore cancelled"
fi
```

## Monitoramento e Performance

### Queries de Monitoramento
```sql
-- 1. Tamanho das tabelas
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as index_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- 2. Queries mais lentas (requer pg_stat_statements)
SELECT
    query,
    calls,
    total_time,
    mean_time,
    stddev_time,
    rows
FROM pg_stat_statements
WHERE query NOT LIKE '%pg_stat%'
ORDER BY mean_time DESC
LIMIT 10;

-- 3. Índices não utilizados
SELECT
    schemaname,
    tablename,
    indexname,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
WHERE idx_tup_read = 0
  AND idx_tup_fetch = 0;

-- 4. Conexões ativas
SELECT
    pid,
    usename,
    application_name,
    client_addr,
    state,
    query_start,
    query
FROM pg_stat_activity
WHERE state = 'active';
```

### Configurações de Performance
```sql
-- postgresql.conf otimizado
shared_buffers = 256MB
effective_cache_size = 1GB
random_page_cost = 1.1
effective_io_concurrency = 200
work_mem = 4MB
maintenance_work_mem = 64MB
max_wal_size = 2GB
min_wal_size = 80MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
```

## Troubleshooting

### Problemas Comuns

#### 1. Deadlocks
```sql
-- Verificar deadlocks
SELECT * FROM pg_stat_database WHERE datname = 'netpilot';

-- Log de deadlocks (postgresql.conf)
log_lock_waits = on
deadlock_timeout = 1s
```

#### 2. Locks Longos
```sql
-- Verificar locks ativos
SELECT
    blocked_locks.pid AS blocked_pid,
    blocked_activity.usename AS blocked_user,
    blocking_locks.pid AS blocking_pid,
    blocking_activity.usename AS blocking_user,
    blocked_activity.query AS blocked_statement,
    blocking_activity.query AS current_statement_in_blocking_process
FROM pg_catalog.pg_locks blocked_locks
JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
JOIN pg_catalog.pg_locks blocking_locks ON blocking_locks.locktype = blocked_locks.locktype
JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
WHERE NOT blocked_locks.granted;
```

#### 3. Conexões Excessivas
```sql
-- Verificar limite de conexões
SHOW max_connections;

-- Verificar conexões atuais
SELECT count(*) FROM pg_stat_activity;

-- Matar conexões ociosas
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE state = 'idle'
  AND query_start < NOW() - INTERVAL '1 hour';
```

---

**Nota**: Este documento deve ser atualizado sempre que houver mudanças no schema do banco de dados.