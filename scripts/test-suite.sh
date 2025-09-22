#!/bin/bash

# NetPilot Complete Test Suite
# Este script executa todos os tipos de teste do projeto

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Contadores
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

print_header() {
    echo -e "${CYAN}============================================${NC}"
    echo -e "${CYAN}       NetPilot - Suíte Completa de Testes${NC}"
    echo -e "${CYAN}============================================${NC}"
    echo
}

print_section() {
    echo -e "${BLUE}🔍 $1${NC}"
    echo -e "${BLUE}----------------------------------------${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
    ((PASSED_TESTS++))
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
    ((FAILED_TESTS++))
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${CYAN}ℹ️  $1${NC}"
}

# Função para executar comando e capturar resultado
run_test() {
    local test_name="$1"
    local command="$2"
    local log_file="$3"

    echo -e "${PURPLE}Executando: $test_name${NC}"

    if eval "$command" > "$log_file" 2>&1; then
        print_success "$test_name passou"
        return 0
    else
        print_error "$test_name falhou"
        echo -e "${RED}Veja os detalhes em: $log_file${NC}"
        return 1
    fi
}

# Verificar se os serviços estão rodando
check_services() {
    print_section "Verificando Serviços"

    # Verificar se o Docker está rodando
    if ! docker ps >/dev/null 2>&1; then
        print_error "Docker não está rodando"
        exit 1
    fi
    print_success "Docker está rodando"

    # Verificar se os containers estão up
    local containers=("netpilot-backend" "netpilot-frontend" "netpilot-db")
    for container in "${containers[@]}"; do
        if docker ps --format "table {{.Names}}" | grep -q "$container"; then
            print_success "Container $container está rodando"
        else
            print_warning "Container $container não está rodando - tentando iniciar..."
            docker-compose up -d "$container" >/dev/null 2>&1 || true
        fi
    done

    echo
}

# Preparar ambiente de teste
setup_test_environment() {
    print_section "Preparando Ambiente de Teste"

    # Criar diretório de logs de teste
    mkdir -p test-results/logs
    mkdir -p test-results/coverage
    mkdir -p test-results/screenshots

    # Limpar logs anteriores
    rm -f test-results/logs/*.log

    print_success "Ambiente de teste preparado"
    echo
}

# Testes Unitários Backend
run_backend_unit_tests() {
    print_section "Testes Unitários Backend (Jest)"

    cd backend

    # Instalar dependências se necessário
    if [ ! -d "node_modules" ]; then
        print_info "Instalando dependências do backend..."
        npm install >/dev/null 2>&1
    fi

    # Executar testes unitários
    run_test "Backend Unit Tests" \
             "npm run test -- --coverage --watchAll=false --testPathPattern='test/unit'" \
             "../test-results/logs/backend-unit.log"

    # Copiar relatório de cobertura
    if [ -d "coverage" ]; then
        cp -r coverage/* ../test-results/coverage/
        print_info "Relatório de cobertura salvo em test-results/coverage/"
    fi

    cd ..
    echo
}

# Testes de Integração Backend
run_backend_integration_tests() {
    print_section "Testes de Integração Backend (E2E)"

    cd backend

    # Aguardar banco de dados estar pronto
    print_info "Aguardando banco de dados..."
    until docker-compose exec -T db pg_isready -U netpilot >/dev/null 2>&1; do
        sleep 2
    done
    print_success "Banco de dados está pronto"

    # Executar testes de integração
    run_test "Backend Integration Tests" \
             "npm run test:e2e -- --watchAll=false" \
             "../test-results/logs/backend-integration.log"

    cd ..
    echo
}

# Testes Unitários Frontend
run_frontend_unit_tests() {
    print_section "Testes Unitários Frontend (Jest)"

    cd frontend

    # Instalar dependências se necessário
    if [ ! -d "node_modules" ]; then
        print_info "Instalando dependências do frontend..."
        npm install >/dev/null 2>&1
    fi

    # Executar testes unitários (se existirem)
    if [ -d "src/__tests__" ] || [ -d "tests" ]; then
        run_test "Frontend Unit Tests" \
                 "npm run test -- --coverage --watchAll=false" \
                 "../test-results/logs/frontend-unit.log"
    else
        print_warning "Testes unitários frontend não encontrados"
    fi

    cd ..
    echo
}

# Testes de Componente Frontend
run_frontend_component_tests() {
    print_section "Testes de Componente Frontend (Cypress)"

    cd frontend

    # Executar testes de componente (se existirem)
    if [ -d "cypress/component" ]; then
        run_test "Frontend Component Tests" \
                 "npx cypress run --component --browser chrome --headless" \
                 "../test-results/logs/frontend-component.log"
    else
        print_warning "Testes de componente não encontrados"
    fi

    cd ..
    echo
}

# Testes E2E Frontend
run_frontend_e2e_tests() {
    print_section "Testes E2E Frontend (Cypress)"

    cd frontend

    # Aguardar frontend estar pronto
    print_info "Aguardando frontend estar pronto..."
    until curl -s http://meadadigital.com:3000 >/dev/null 2>&1; do
        sleep 5
        echo -n "."
    done
    echo
    print_success "Frontend está respondendo"

    # Executar testes E2E
    run_test "Frontend E2E Tests" \
             "npx cypress run --browser chrome --headless --record false" \
             "../test-results/logs/frontend-e2e.log"

    # Copiar screenshots e vídeos se existirem
    if [ -d "cypress/screenshots" ]; then
        cp -r cypress/screenshots/* ../test-results/screenshots/ 2>/dev/null || true
    fi
    if [ -d "cypress/videos" ]; then
        cp -r cypress/videos/* ../test-results/screenshots/ 2>/dev/null || true
    fi

    cd ..
    echo
}

# Testes de Performance
run_performance_tests() {
    print_section "Testes de Performance"

    if [ -d "tests/performance" ]; then
        cd tests/performance

        # Executar testes de carga
        if [ -f "package.json" ]; then
            run_test "Performance Tests" \
                     "npm test" \
                     "../../test-results/logs/performance.log"
        else
            print_warning "Testes de performance não configurados"
        fi

        cd ../..
    else
        print_warning "Diretório de testes de performance não encontrado"
    fi

    echo
}

# Testes de Segurança
run_security_tests() {
    print_section "Testes de Segurança"

    # Verificar vulnerabilidades NPM
    print_info "Verificando vulnerabilidades do backend..."
    cd backend
    if npm audit --audit-level=high > ../test-results/logs/backend-security.log 2>&1; then
        print_success "Backend: Nenhuma vulnerabilidade crítica encontrada"
    else
        print_warning "Backend: Vulnerabilidades encontradas - veja backend-security.log"
    fi
    cd ..

    print_info "Verificando vulnerabilidades do frontend..."
    cd frontend
    if npm audit --audit-level=high > ../test-results/logs/frontend-security.log 2>&1; then
        print_success "Frontend: Nenhuma vulnerabilidade crítica encontrada"
    else
        print_warning "Frontend: Vulnerabilidades encontradas - veja frontend-security.log"
    fi
    cd ..

    echo
}

# Testes de API
run_api_tests() {
    print_section "Testes de API (Postman/Newman)"

    if [ -f "tests/api/netpilot-api.postman_collection.json" ]; then
        # Executar testes com Newman se disponível
        if command -v newman >/dev/null 2>&1; then
            run_test "API Tests" \
                     "newman run tests/api/netpilot-api.postman_collection.json --environment tests/api/test-environment.json" \
                     "test-results/logs/api-tests.log"
        else
            print_warning "Newman não está instalado - instalando..."
            npm install -g newman >/dev/null 2>&1 || print_warning "Falha ao instalar Newman"
        fi
    else
        print_warning "Coleção de testes de API não encontrada"
    fi

    echo
}

# Testes de Smoke
run_smoke_tests() {
    print_section "Testes de Smoke"

    # Testes básicos de disponibilidade
    local endpoints=(
        "http://meadadigital.com:3000"
        "http://meadadigital.com:3001/api/health"
        "http://meadadigital.com:8080"
    )

    for endpoint in "${endpoints[@]}"; do
        if curl -s -f "$endpoint" >/dev/null 2>&1; then
            print_success "Endpoint $endpoint está respondendo"
        else
            print_error "Endpoint $endpoint não está respondendo"
        fi
    done

    echo
}

# Gerar relatório final
generate_report() {
    print_section "Gerando Relatório Final"

    local report_file="test-results/test-report.html"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')

    cat > "$report_file" << EOF
<!DOCTYPE html>
<html>
<head>
    <title>NetPilot - Relatório de Testes</title>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; border-radius: 8px; }
        .summary { background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .success { color: #16a34a; }
        .error { color: #dc2626; }
        .warning { color: #ca8a04; }
        .log-section { margin: 20px 0; }
        .log-content { background: #1f2937; color: #f9fafb; padding: 15px; border-radius: 8px; overflow-x: auto; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚀 NetPilot - Relatório de Testes</h1>
        <p>Gerado em: $timestamp</p>
    </div>

    <div class="summary">
        <h2>📊 Resumo dos Testes</h2>
        <table>
            <tr>
                <td><strong>Total de Testes:</strong></td>
                <td>$((PASSED_TESTS + FAILED_TESTS))</td>
            </tr>
            <tr>
                <td><strong>Testes Passaram:</strong></td>
                <td class="success">$PASSED_TESTS</td>
            </tr>
            <tr>
                <td><strong>Testes Falharam:</strong></td>
                <td class="error">$FAILED_TESTS</td>
            </tr>
            <tr>
                <td><strong>Taxa de Sucesso:</strong></td>
                <td>$(echo "scale=2; $PASSED_TESTS * 100 / ($PASSED_TESTS + $FAILED_TESTS)" | bc 2>/dev/null || echo "N/A")%</td>
            </tr>
        </table>
    </div>

    <h2>📋 Detalhes dos Testes</h2>
EOF

    # Adicionar logs de cada tipo de teste
    for log_file in test-results/logs/*.log; do
        if [ -f "$log_file" ]; then
            local test_name=$(basename "$log_file" .log)
            echo "<div class=\"log-section\">" >> "$report_file"
            echo "<h3>$test_name</h3>" >> "$report_file"
            echo "<div class=\"log-content\">" >> "$report_file"
            echo "<pre>$(tail -50 "$log_file" | sed 's/&/\&amp;/g; s/</\&lt;/g; s/>/\&gt;/g')</pre>" >> "$report_file"
            echo "</div>" >> "$report_file"
            echo "</div>" >> "$report_file"
        fi
    done

    echo "</body></html>" >> "$report_file"

    print_success "Relatório gerado: $report_file"

    # Abrir relatório no browser se possível
    if command -v xdg-open >/dev/null 2>&1; then
        xdg-open "$report_file" 2>/dev/null || true
    elif command -v open >/dev/null 2>&1; then
        open "$report_file" 2>/dev/null || true
    fi
}

# Função principal
main() {
    print_header

    # Verificar se estamos no diretório correto
    if [ ! -f "docker-compose.yml" ]; then
        print_error "Execute este script no diretório raiz do projeto NetPilot"
        exit 1
    fi

    # Verificar argumentos
    local run_all=true
    local run_specific=""

    case "${1:-all}" in
        "unit")
            run_specific="unit"
            run_all=false
            ;;
        "integration")
            run_specific="integration"
            run_all=false
            ;;
        "e2e")
            run_specific="e2e"
            run_all=false
            ;;
        "security")
            run_specific="security"
            run_all=false
            ;;
        "performance")
            run_specific="performance"
            run_all=false
            ;;
        "smoke")
            run_specific="smoke"
            run_all=false
            ;;
        "help")
            echo "Uso: $0 [tipo]"
            echo "Tipos: all, unit, integration, e2e, security, performance, smoke"
            exit 0
            ;;
    esac

    # Executar verificações iniciais
    check_services
    setup_test_environment

    # Executar testes baseado nos argumentos
    if [ "$run_all" = true ] || [ "$run_specific" = "unit" ]; then
        run_backend_unit_tests
        run_frontend_unit_tests
    fi

    if [ "$run_all" = true ] || [ "$run_specific" = "integration" ]; then
        run_backend_integration_tests
        run_frontend_component_tests
    fi

    if [ "$run_all" = true ] || [ "$run_specific" = "e2e" ]; then
        run_frontend_e2e_tests
        run_api_tests
    fi

    if [ "$run_all" = true ] || [ "$run_specific" = "security" ]; then
        run_security_tests
    fi

    if [ "$run_all" = true ] || [ "$run_specific" = "performance" ]; then
        run_performance_tests
    fi

    if [ "$run_all" = true ] || [ "$run_specific" = "smoke" ]; then
        run_smoke_tests
    fi

    # Gerar relatório final
    generate_report

    # Mostrar resultado final
    echo
    print_section "Resultado Final"

    if [ $FAILED_TESTS -eq 0 ]; then
        print_success "Todos os testes passaram! 🎉"
        echo -e "${GREEN}✅ $PASSED_TESTS testes executados com sucesso${NC}"
    else
        print_error "Alguns testes falharam"
        echo -e "${RED}❌ $FAILED_TESTS testes falharam${NC}"
        echo -e "${GREEN}✅ $PASSED_TESTS testes passaram${NC}"
        exit 1
    fi

    echo
    print_info "Relatório completo disponível em: test-results/test-report.html"
    print_info "Logs detalhados em: test-results/logs/"

    if [ -d "test-results/coverage" ]; then
        print_info "Relatório de cobertura em: test-results/coverage/"
    fi
}

# Executar função principal com todos os argumentos
main "$@"