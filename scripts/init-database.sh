#!/bin/bash

# NetPilot Database Initialization Script
# Este script cria todas as tabelas e insere dados iniciais

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_header() {
    echo -e "${BLUE}============================================${NC}"
    echo -e "${BLUE}       NetPilot - Database Initialization${NC}"
    echo -e "${BLUE}============================================${NC}"
    echo
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

# Function to run SQL commands
run_sql() {
    local description="$1"
    local sql_command="$2"

    print_info "Executando: $description"

    if docker-compose exec -T db psql -U netpilot -d netpilot -c "$sql_command" >/dev/null 2>&1; then
        print_success "$description - Concluído"
        return 0
    else
        print_error "$description - Falhou"
        return 1
    fi
}

# Main function
main() {
    print_header

    # Check if database is accessible
    print_info "Verificando conectividade com o banco de dados..."
    if ! docker-compose exec -T db psql -U netpilot -d netpilot -c "SELECT 1" >/dev/null 2>&1; then
        print_error "Não foi possível conectar ao banco de dados"
        exit 1
    fi
    print_success "Conexão com banco de dados estabelecida"

    # Create UUID extension
    run_sql "Criando extensão UUID" "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"

    # Create custom types
    print_info "Criando tipos personalizados..."

    docker-compose exec -T db psql -U netpilot -d netpilot << 'EOF'
DO $$ BEGIN
    CREATE TYPE log_type AS ENUM ('deployment', 'ssl_renewal', 'nginx_reload', 'traefik_reload', 'system');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE log_status AS ENUM ('success', 'failed', 'running', 'pending');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE redirect_type AS ENUM ('temporary', 'permanent');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE certificate_status AS ENUM ('valid', 'expiring', 'expired', 'pending', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
EOF

    print_success "Tipos personalizados criados"

    # Create tables
    print_info "Criando tabelas..."

    docker-compose exec -T db psql -U netpilot -d netpilot << 'EOF'
-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email VARCHAR UNIQUE NOT NULL,
    password VARCHAR NOT NULL,
    role VARCHAR DEFAULT 'admin',
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Domains table
CREATE TABLE IF NOT EXISTS domains (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
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

-- Logs table
CREATE TABLE IF NOT EXISTS logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
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

-- Proxy Rules table
CREATE TABLE IF NOT EXISTS proxy_rules (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
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

-- Redirects table
CREATE TABLE IF NOT EXISTS redirects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
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

-- SSL Certificates table
CREATE TABLE IF NOT EXISTS ssl_certificates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
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

-- SSH Sessions table
CREATE TABLE IF NOT EXISTS ssh_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
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

-- Console Logs table
CREATE TABLE IF NOT EXISTS console_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    command TEXT NOT NULL,
    output TEXT,
    "exitCode" INTEGER,
    "executedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "sessionId" UUID REFERENCES ssh_sessions(id) ON DELETE CASCADE,
    "userId" UUID REFERENCES users(id) ON DELETE CASCADE
);
EOF

    print_success "Todas as tabelas criadas"

    # Insert initial data
    print_info "Inserindo dados iniciais..."

    # Generate admin password hash
    local admin_password_hash=$(docker-compose exec -T backend node -e "
        const bcrypt = require('bcryptjs');
        bcrypt.hash('admin123', 10).then(hash => {
            console.log(hash);
        });
    ")

    docker-compose exec -T db psql -U netpilot -d netpilot << EOF
-- Insert admin user
INSERT INTO users (email, password, role)
VALUES ('admin@netpilot.local', '$admin_password_hash', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Insert sample domains
INSERT INTO domains (name, description, "isActive", "autoTls", "forceHttps", "enableWwwRedirect")
VALUES
    ('netpilot.meadadigital.com', 'Domínio principal do NetPilot', true, true, true, true),
    ('example.com', 'Domínio de exemplo para testes', true, true, false, false),
    ('api.netpilot.com', 'API dedicada do NetPilot', true, true, true, false)
ON CONFLICT (name) DO NOTHING;

-- Insert sample data with relationships
DO \$\$
DECLARE
    domain_id UUID;
    example_domain_id UUID;
    api_domain_id UUID;
BEGIN
    -- Get domain IDs
    SELECT id INTO domain_id FROM domains WHERE name = 'netpilot.meadadigital.com';
    SELECT id INTO example_domain_id FROM domains WHERE name = 'example.com';
    SELECT id INTO api_domain_id FROM domains WHERE name = 'api.netpilot.com';

    -- Insert proxy rules
    INSERT INTO proxy_rules ("sourcePath", "targetUrl", priority, "isActive", "maintainQueryStrings", description, "domainId")
    VALUES
        ('/api/*', 'http://backend:3001', 1, true, true, 'Proxy para API backend', domain_id),
        ('/*', 'http://frontend:3000', 2, true, true, 'Proxy para frontend', domain_id),
        ('/health', 'http://backend:3001/health', 1, true, false, 'Health check endpoint', api_domain_id),
        ('/*', 'http://backend:3001', 2, true, true, 'API completa', api_domain_id)
    ON CONFLICT DO NOTHING;

    -- Insert redirects
    INSERT INTO redirects ("sourcePattern", "targetUrl", type, "isActive", priority, description, "domainId")
    VALUES
        ('/old-dashboard', '/dashboard', 'permanent', true, 1, 'Redirect dashboard antigo', domain_id),
        ('/admin', '/dashboard', 'permanent', true, 2, 'Redirect admin para dashboard', domain_id),
        ('/www', '/', 'permanent', true, 3, 'Remove www do path', example_domain_id)
    ON CONFLICT DO NOTHING;

    -- Insert SSL certificates
    INSERT INTO ssl_certificates ("primaryDomain", "sanDomains", status, "expiresAt", "autoRenew", issuer, "domainId")
    VALUES
        ('netpilot.meadadigital.com', ARRAY['www.netpilot.meadadigital.com'], 'valid', CURRENT_TIMESTAMP + INTERVAL '85 days', true, 'Let''s Encrypt', domain_id),
        ('example.com', ARRAY['www.example.com'], 'valid', CURRENT_TIMESTAMP + INTERVAL '90 days', true, 'Let''s Encrypt', example_domain_id),
        ('api.netpilot.com', ARRAY[]::text[], 'valid', CURRENT_TIMESTAMP + INTERVAL '75 days', true, 'Let''s Encrypt', api_domain_id)
    ON CONFLICT DO NOTHING;
END \$\$;

-- Insert sample logs
INSERT INTO logs (type, status, action, message, duration, "startedAt", "completedAt")
VALUES
    ('deployment', 'success', 'Deploy do Nginx', 'Configuração do Nginx aplicada com sucesso', 2500, CURRENT_TIMESTAMP - INTERVAL '1 hour', CURRENT_TIMESTAMP - INTERVAL '1 hour' + INTERVAL '2500 milliseconds'),
    ('ssl_renewal', 'success', 'Renovação SSL netpilot.meadadigital.com', 'Certificado SSL renovado com sucesso', 15000, CURRENT_TIMESTAMP - INTERVAL '2 hours', CURRENT_TIMESTAMP - INTERVAL '2 hours' + INTERVAL '15 seconds'),
    ('traefik_reload', 'success', 'Reload do Traefik', 'Configuração do Traefik recarregada', 1200, CURRENT_TIMESTAMP - INTERVAL '30 minutes', CURRENT_TIMESTAMP - INTERVAL '30 minutes' + INTERVAL '1200 milliseconds'),
    ('system', 'failed', 'Backup automático', 'Falha na criação do backup: espaço insuficiente', 5000, CURRENT_TIMESTAMP - INTERVAL '6 hours', CURRENT_TIMESTAMP - INTERVAL '6 hours' + INTERVAL '5 seconds'),
    ('nginx_reload', 'success', 'Reload do Nginx', 'Configuração do Nginx recarregada após mudança de domínio', 800, CURRENT_TIMESTAMP - INTERVAL '45 minutes', CURRENT_TIMESTAMP - INTERVAL '45 minutes' + INTERVAL '800 milliseconds'),
    ('ssl_renewal', 'running', 'Renovação SSL example.com', 'Processando renovação do certificado', NULL, CURRENT_TIMESTAMP - INTERVAL '5 minutes', NULL)
ON CONFLICT DO NOTHING;
EOF

    print_success "Dados iniciais inseridos"

    # Display summary
    echo
    print_info "Resumo da inicialização:"

    docker-compose exec -T db psql -U netpilot -d netpilot -c "
    SELECT 'users' as tabela, count(*) as registros FROM users
    UNION ALL
    SELECT 'domains', count(*) FROM domains
    UNION ALL
    SELECT 'proxy_rules', count(*) FROM proxy_rules
    UNION ALL
    SELECT 'redirects', count(*) FROM redirects
    UNION ALL
    SELECT 'ssl_certificates', count(*) FROM ssl_certificates
    UNION ALL
    SELECT 'logs', count(*) FROM logs
    ORDER BY tabela;
    "

    echo
    print_success "🎉 Banco de dados NetPilot inicializado com sucesso!"
    print_info "Credenciais de acesso:"
    print_info "  Email: admin@netpilot.local"
    print_info "  Senha: admin123"
    echo
}

# Execute main function
main "$@"