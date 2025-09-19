#!/bin/bash

# NetPilot Setup Script
# Este script configura o ambiente NetPilot automaticamente

set -e

echo "🚀 Iniciando configuração do NetPilot..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para imprimir mensagens coloridas
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Verificar se Docker está instalado
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker não está instalado. Instale o Docker primeiro."
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose não está instalado. Instale o Docker Compose primeiro."
        exit 1
    fi

    print_status "Docker e Docker Compose encontrados"
}

# Verificar portas disponíveis
check_ports() {
    local ports=(80 443 3000 3001 5432 8080 8081)
    local occupied_ports=()

    for port in "${ports[@]}"; do
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null; then
            occupied_ports+=($port)
        fi
    done

    if [ ${#occupied_ports[@]} -ne 0 ]; then
        print_warning "As seguintes portas estão ocupadas: ${occupied_ports[*]}"
        print_info "Certifique-se de liberar essas portas antes de continuar"
        read -p "Continuar assim mesmo? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    else
        print_status "Todas as portas necessárias estão disponíveis"
    fi
}

# Criar arquivo .env se não existir
setup_env() {
    if [ ! -f .env ]; then
        print_info "Criando arquivo .env..."
        cp .env.example .env

        # Gerar JWT secret aleatório
        JWT_SECRET=$(openssl rand -base64 32)
        sed -i "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" .env

        print_status "Arquivo .env criado com JWT secret gerado"
    else
        print_info "Arquivo .env já existe"
    fi
}

# Criar diretórios necessários
create_directories() {
    print_info "Criando estrutura de diretórios..."

    mkdir -p configs/{nginx,traefik,ssl}
    mkdir -p scripts

    # Definir permissões para diretório SSL
    chmod 700 configs/ssl

    print_status "Estrutura de diretórios criada"
}

# Construir e iniciar containers
start_services() {
    print_info "Construindo e iniciando serviços..."

    # Pull das imagens base para acelerar o processo
    docker-compose pull db traefik nginx

    # Build e start
    docker-compose up -d --build

    print_status "Serviços iniciados"
}

# Aguardar serviços ficarem prontos
wait_for_services() {
    print_info "Aguardando serviços ficarem prontos..."

    # Aguardar database
    echo -n "Aguardando PostgreSQL"
    until docker-compose exec -T db pg_isready -U netpilot >/dev/null 2>&1; do
        echo -n "."
        sleep 2
    done
    echo " ✅"

    # Aguardar backend
    echo -n "Aguardando Backend"
    until curl -s http://localhost:3001/api/health >/dev/null 2>&1; do
        echo -n "."
        sleep 2
    done
    echo " ✅"

    # Aguardar frontend
    echo -n "Aguardando Frontend"
    until curl -s http://localhost:3000 >/dev/null 2>&1; do
        echo -n "."
        sleep 2
    done
    echo " ✅"

    print_status "Todos os serviços estão prontos"
}

# Verificar status dos serviços
check_services() {
    print_info "Verificando status dos serviços..."

    docker-compose ps

    # Verificar se todos estão healthy
    local unhealthy=$(docker-compose ps --services --filter "status=exited")
    if [ -n "$unhealthy" ]; then
        print_warning "Alguns serviços não estão funcionando corretamente:"
        echo "$unhealthy"
        print_info "Execute 'docker-compose logs [serviço]' para ver os logs"
    else
        print_status "Todos os serviços estão funcionando"
    fi
}

# Mostrar informações finais
show_final_info() {
    print_status "NetPilot configurado com sucesso!"
    echo
    print_info "🌐 Acesse a interface em: http://localhost:3000"
    print_info "📚 Documentação da API: http://localhost:3001/api/docs"
    print_info "🔧 Dashboard Traefik: http://localhost:8080"
    print_info "📊 Status Nginx: http://localhost:8081"
    echo
    print_info "🔐 Login inicial:"
    print_info "   Email: admin@netpilot.local"
    print_info "   Senha: admin123"
    echo
    print_info "📋 Comandos úteis:"
    print_info "   Logs: docker-compose logs -f"
    print_info "   Parar: docker-compose down"
    print_info "   Restart: docker-compose restart"
    print_info "   Status: docker-compose ps"
}

# Função principal
main() {
    echo "=========================================="
    echo "   NetPilot - Sistema de Proxy Reverso   "
    echo "=========================================="
    echo

    # Verificações iniciais
    check_docker
    check_ports

    # Setup
    setup_env
    create_directories

    # Iniciar serviços
    start_services

    # Aguardar e verificar
    wait_for_services
    check_services

    # Informações finais
    show_final_info
}

# Executar script principal
main "$@"