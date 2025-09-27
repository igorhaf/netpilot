#!/bin/bash

set -e  # para se algum comando falhar, o script para
set -o pipefail

echo "🛑 Derrubando containers Docker..."
docker compose down || true

# FRONTEND
echo "➡️ Buildando FRONTEND..."
cd frontend
if [ -d ".next" ]; then
  echo "🧹 Limpando .next do frontend..."
  rm -rf .next
fi
npm install --legacy-peer-deps
npm run build
cd ..

# BACKEND
echo "➡️ Buildando BACKEND..."
cd backend
if [ -d ".next" ]; then
  echo "🧹 Limpando .next do backend..."
  rm -rf .next
fi
npm install --legacy-peer-deps
npm run build
cd ..

# DOCKER UP
echo "🚀 Subindo containers Docker..."
docker compose up -d

echo "✅ Deploy concluído com sucesso!"

