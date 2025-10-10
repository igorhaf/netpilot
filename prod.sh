#!/bin/bash

# Script para rodar NetPilot em modo produção

set -e

echo "🚀 Iniciando NetPilot em modo PRODUÇÃO..."
echo ""

# Cores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Parar containers de dev se existirem
echo -e "${BLUE}🔄 Parando containers de desenvolvimento (se existirem)...${NC}"
docker-compose -f docker-compose.yml -f docker-compose.dev.yml down 2>/dev/null || true

# Build e start em produção
echo -e "${BLUE}🏗️  Construindo imagens de produção...${NC}"
docker-compose build

echo -e "${BLUE}🚀 Iniciando todos os serviços em modo produção...${NC}"
docker-compose up -d

echo ""
echo -e "${GREEN}✅ NetPilot rodando em modo PRODUÇÃO!${NC}"
echo ""
echo -e "${BLUE}🌐 URLs de acesso:${NC}"
echo "   Frontend: https://netpilot.meadadigital.com"
echo "   Backend:  https://netpilot.meadadigital.com/api"
echo "   API Docs: https://netpilot.meadadigital.com/api/docs"
echo ""
echo -e "${BLUE}📊 Serviços:${NC}"
docker-compose ps
