#!/bin/bash

# NetPilot Database Reset Script
# Este script reseta completamente o banco de dados

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_header() {
    echo -e "${RED}============================================${NC}"
    echo -e "${RED}       NetPilot - Database Reset${NC}"
    echo -e "${RED}============================================${NC}"
    echo
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Function to confirm reset
confirm_reset() {
    echo -e "${RED}⚠️  ATENÇÃO: Esta operação irá APAGAR TODOS OS DADOS do banco!${NC}"
    echo -e "${RED}⚠️  Todos os domínios, certificados, logs e configurações serão perdidos!${NC}"
    echo
    read -p "Tem certeza que deseja continuar? Digite 'RESET' para confirmar: " confirmation

    if [ "$confirmation" != "RESET" ]; then
        print_info "Operação cancelada pelo usuário"
        exit 0
    fi
}

# Main function
main() {
    print_header

    # Confirm operation
    confirm_reset

    print_info "Iniciando reset do banco de dados..."

    # Check if database is accessible
    if ! docker-compose exec -T db psql -U netpilot -d netpilot -c "SELECT 1" >/dev/null 2>&1; then
        print_error "Não foi possível conectar ao banco de dados"
        exit 1
    fi

    # Drop all tables and types
    print_info "Removendo todas as tabelas e tipos..."

    docker-compose exec -T db psql -U netpilot -d netpilot << 'EOF'
-- Drop all tables with CASCADE to handle dependencies
DROP TABLE IF EXISTS console_logs CASCADE;
DROP TABLE IF EXISTS ssh_sessions CASCADE;
DROP TABLE IF EXISTS ssl_certificates CASCADE;
DROP TABLE IF EXISTS redirects CASCADE;
DROP TABLE IF EXISTS proxy_rules CASCADE;
DROP TABLE IF EXISTS logs CASCADE;
DROP TABLE IF EXISTS domains CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop custom types
DROP TYPE IF EXISTS certificate_status CASCADE;
DROP TYPE IF EXISTS redirect_type CASCADE;
DROP TYPE IF EXISTS log_status CASCADE;
DROP TYPE IF EXISTS log_type CASCADE;

-- Keep UUID extension
-- DROP EXTENSION IF EXISTS "uuid-ossp";
EOF

    print_success "Todas as tabelas e tipos removidos"

    # Verify cleanup
    local table_count=$(docker-compose exec -T db psql -U netpilot -d netpilot -c "\dt" | grep -c "table" || echo "0")

    if [ "$table_count" -eq "0" ]; then
        print_success "Banco de dados completamente limpo"
    else
        print_warning "Algumas tabelas ainda podem existir"
    fi

    # Ask if user wants to reinitialize
    echo
    read -p "Deseja reinicializar o banco de dados agora? (y/N): " reinit

    if [[ $reinit =~ ^[Yy]$ ]]; then
        print_info "Executando inicialização do banco..."
        ./scripts/init-database.sh
    else
        print_info "Para reinicializar o banco, execute: ./scripts/init-database.sh"
    fi

    echo
    print_success "🔄 Reset do banco de dados concluído!"
}

# Execute main function
main "$@"