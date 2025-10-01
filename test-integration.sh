#!/bin/bash

echo "=== Teste de Integração NetPilot ==="
echo "Verificando qual serviço está processando cada recurso..."
echo ""

# Cores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# URLs base
NESTJS_URL="http://localhost:3001"
PYTHON_URL="http://localhost:8001"

echo -e "${BLUE}=== 1. Testando Health Checks ===${NC}"

echo -e "${YELLOW}1.1 NestJS Backend:${NC}"
curl -s "$NESTJS_URL/health" | jq '.' 2>/dev/null || echo "❌ NestJS não disponível"

echo -e "${YELLOW}1.2 Python System Ops:${NC}"
curl -s "$PYTHON_URL/health" | jq '.' 2>/dev/null || echo "❌ Python não disponível"

echo ""
echo -e "${BLUE}=== 2. Testando Job Queues ===${NC}"

echo -e "${YELLOW}2.1 Listando Job Queues (NestJS):${NC}"
curl -s "$NESTJS_URL/job-queues" -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImFkbWluQG5ldHBpbG90LmxvY2FsIiwic3ViIjoiZTg1ZmYxOTEtNDIyMy00MmM2LTkxOWQtMWYyMzM3NjY3YmIzIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzU4OTUzODU1LCJleHAiOjE3NTk1NTg2NTV9.CMwhTQqvzsTJFBHMR5nrM-2l4UBlhiWwupT2IV902kE" | jq '.[] | .name' 2>/dev/null || echo "❌ Erro ao listar job queues"

echo -e "${YELLOW}2.2 Executando Job (Python via NestJS):${NC}"
# Exemplo de execução de job que deve passar pelo Python
curl -s -X POST "$NESTJS_URL/job-queues/test-job/execute" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImFkbWluQG5ldHBpbG90LmxvY2FsIiwic3ViIjoiZTg1ZmYxOTEtNDIyMy00MmM2LTkxOWQtMWYyMzM3NjY3YmIzIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzU4OTUzODU1LCJleHAiOjE3NTk1NTg2NTV9.CMwhTQqvzsTJFBHMR5nrM-2l4UBlhiWwupT2IV902kE" \
  -d '{"environmentVars": {"TEST": "integration"}}' | jq '.' 2>/dev/null || echo "❌ Erro ao executar job"

echo ""
echo -e "${BLUE}=== 3. Testando System Operations ===${NC}"

echo -e "${YELLOW}3.1 System Info (Python direto):${NC}"
curl -s "$PYTHON_URL/system/info" | jq '.system' 2>/dev/null || echo "❌ Erro ao obter system info"

echo -e "${YELLOW}3.2 Nginx Status (Python direto):${NC}"
curl -s "$PYTHON_URL/nginx/status" | jq '.nginx_running' 2>/dev/null || echo "❌ Erro ao obter nginx status"

echo ""
echo -e "${BLUE}=== 4. Testando SSH Console ===${NC}"

echo -e "${YELLOW}4.1 SSH Health (Python direto):${NC}"
curl -s "$PYTHON_URL/ssh/health" | jq '.status' 2>/dev/null || echo "❌ SSH service não disponível"

echo -e "${YELLOW}4.2 SSH Sessions via NestJS (deve chamar Python):${NC}"
curl -s "$NESTJS_URL/console/sessions" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImFkbWluQG5ldHBpbG90LmxvY2FsIiwic3ViIjoiZTg1ZmYxOTEtNDIyMy00MmM2LTkxOWQtMWYyMzM3NjY3YmIzIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzU4OTUzODU1LCJleHAiOjE3NTk1NTg2NTV9.CMwhTQqvzsTJFBHMR5nrM-2l4UBlhiWwupT2IV902kE" | jq '.' 2>/dev/null || echo "❌ Erro ao listar sessões SSH"

echo ""
echo -e "${BLUE}=== 5. Testando Monitoring ===${NC}"

echo -e "${YELLOW}5.1 Monitoring Overview (Python direto):${NC}"
curl -s "$PYTHON_URL/monitoring/overview" | jq '.system_status' 2>/dev/null || echo "❌ Monitoring não disponível"

echo ""
echo -e "${GREEN}=== Resumo dos Serviços ===${NC}"
echo -e "${YELLOW}✅ Recursos processados pelo NestJS:${NC}"
echo "   - Autenticação e autorização"
echo "   - CRUD de entidades (domains, users, etc)"
echo "   - Interface com banco de dados"
echo "   - Job queue management"
echo ""
echo -e "${YELLOW}✅ Recursos processados pelo Python:${NC}"
echo "   - Execução de scripts/jobs"
echo "   - Operações SSH"
echo "   - Configuração Nginx"
echo "   - Monitoramento do sistema"
echo "   - Operações SSL"
echo ""
echo -e "${YELLOW}🔄 Recursos híbridos (NestJS → Python):${NC}"
echo "   - Execução de jobs (NestJS gerencia, Python executa)"
echo "   - Console SSH (NestJS autentica, Python conecta)"
echo "   - Logs em tempo real (WebSocket + Python)"