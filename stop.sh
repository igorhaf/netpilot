#!/bin/bash

# Script para parar completamente o projeto NetPilot
set -e

echo "🛑 Parando NetPilot..."
echo ""

# Perguntar se deve remover volumes (dados)
read -p "❓ Remover volumes (dados do banco)? [s/N]: " -n 1 -r
echo ""
REMOVE_VOLUMES=$REPLY

echo ""
echo "🔴 Parando todos os containers NetPilot..."

# Parar e remover TODOS os containers NetPilot primeiro (incluindo os do dev.sh)
docker ps -a --filter "name=netpilot" --format "{{.Names}}" | xargs -r docker stop 2>/dev/null || true
docker ps -a --filter "name=netpilot" --format "{{.Names}}" | xargs -r docker rm -f 2>/dev/null || true

echo "🔌 Removendo configurações do docker-compose..."

# Remover volumes se solicitado
if [[ $REMOVE_VOLUMES =~ ^[Ss]$ ]]; then
  echo "🗑️  Removendo volumes (dados serão perdidos)..."
  docker-compose down -v 2>/dev/null || true
  echo "✅ Volumes removidos!"
else
  echo "💾 Volumes preservados (dados mantidos)"
  docker-compose down 2>/dev/null || true
fi

echo ""
echo "✅ NetPilot parado completamente!"
echo ""
echo "📊 Status:"
docker ps --format "table {{.Names}}\t{{.Status}}" | grep netpilot || echo "   Nenhum container NetPilot rodando"
echo ""
echo "💡 Para iniciar novamente:"
echo "   ./dev.sh          # Modo desenvolvimento"
echo "   docker-compose up # Modo produção"
echo ""
