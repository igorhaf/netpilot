#!/bin/bash

# Script de desenvolvimento com hot-reload
set -e

# Parse de argumentos
BACKGROUND=false
while [[ $# -gt 0 ]]; do
  case $1 in
    -d)
      BACKGROUND=true
      shift
      ;;
    *)
      echo "Uso: $0 [-d]"
      echo "  -d: Rodar em background (sem exibir logs ao vivo)"
      exit 1
      ;;
  esac
done

echo "🚀 Modo DESENVOLVIMENTO com hot-reload"
if [ "$BACKGROUND" = true ]; then
  echo "🔇 Modo background ativado (sem logs ao vivo)"
fi
echo ""

# Parar e remover containers antigos de forma agressiva
echo "🧹 Limpando containers antigos..."

# Primeira tentativa: remover por nome
docker rm -f netpilot-backend 2>/dev/null || true
docker rm -f netpilot-frontend 2>/dev/null || true

# Segunda tentativa: buscar por filtro e remover por ID
BACKEND_CONTAINERS=$(docker ps -aq --filter "name=netpilot-backend")
if [ ! -z "$BACKEND_CONTAINERS" ]; then
  echo "⚠️  Removendo containers backend órfãos..."
  echo "$BACKEND_CONTAINERS" | xargs -r docker rm -f
fi

FRONTEND_CONTAINERS=$(docker ps -aq --filter "name=netpilot-frontend")
if [ ! -z "$FRONTEND_CONTAINERS" ]; then
  echo "⚠️  Removendo containers frontend órfãos..."
  echo "$FRONTEND_CONTAINERS" | xargs -r docker rm -f
fi

# Terceira tentativa: remover QUALQUER container com exatamente esse nome (última chance)
docker ps -a --format "{{.ID}} {{.Names}}" | grep -E "netpilot-backend$|netpilot-frontend$" | awk '{print $1}' | xargs -r docker rm -f 2>/dev/null || true

# Aguardar um momento para garantir que foram removidos
sleep 1

echo "✅ Limpeza concluída!"
echo ""

# Garantir infraestrutura (apenas serviços base, SEM backend/frontend)
echo "🔧 Iniciando infraestrutura (DB, Redis, MySQL, Traefik)..."
docker-compose up -d --no-deps db redis mysql traefik
sleep 3

# Iniciar Nginx separadamente (ele pode ter dependências do backend/frontend)
echo "🔧 Iniciando Nginx..."
docker-compose up -d --no-deps nginx 2>/dev/null || docker run -d \
  --name netpilot-nginx \
  --network netpilot_netpilot-network \
  -p 3010:80 \
  -v "$(pwd)/configs/nginx/sites:/etc/nginx/conf.d" \
  -v "$(pwd)/configs/nginx/nginx.conf:/etc/nginx/nginx.conf" \
  -v "$(pwd)/configs/ssl/certs:/etc/ssl/certs" \
  -v "$(pwd)/configs/ssl/private:/etc/ssl/private" \
  nginx:alpine

sleep 2

echo "✅ Infraestrutura iniciada!"

# Backend com hot-reload
echo "🔧 Iniciando backend (hot-reload)..."
docker run -d \
  --name netpilot-backend \
  --network netpilot_netpilot-network \
  -p 3001:3001 \
  -e NODE_ENV=development \
  -e DATABASE_URL=postgresql://netpilot:netpilot123@netpilot-db:5432/netpilot \
  -e MYSQL_URL=mysql://netpilot:netpilot123@netpilot-mysql:3306/netpilot \
  -e JWT_SECRET=netpilot_jwt_secret_key_2024 \
  -e REDIS_HOST=netpilot-redis \
  -e REDIS_PORT=6379 \
  -e SSH_DEFAULT_HOST=localhost \
  -e SSH_DEFAULT_PORT=22 \
  -e SSH_DEFAULT_USER=root \
  -e SSH_DEFAULT_AUTH_TYPE=password \
  -e SSH_DEFAULT_PASSWORD=netpilot123 \
  -e DOCKER_SOCKET_PATH=/var/run/docker.sock \
  -e SYSTEM_OPS_URL=http://172.18.0.1:8001 \
  -v "$(pwd)/backend:/app" \
  -v "$(pwd)/configs:/app/configs" \
  -v "$(pwd)/scripts:/app/scripts" \
  -v "/var/run/docker.sock:/var/run/docker.sock" \
  -v "/home:/host/home:rw" \
  node:18-alpine \
  sh -c "apk add --no-cache git bash shadow python3 && cd /app && npm install && npm run start:dev"

# Frontend com hot-reload otimizado
echo "🔧 Iniciando frontend (hot-reload)..."
docker run -d \
  --name netpilot-frontend \
  --network netpilot_netpilot-network \
  -p 3000:3000 \
  -e NODE_ENV=development \
  -e NEXT_PUBLIC_API_URL=https://netpilot.meadadigital.com \
  -e WATCHPACK_POLLING=true \
  -v "$(pwd)/frontend:/app" \
  -v "/app/node_modules" \
  -v "/app/.next" \
  node:18-alpine \
  sh -c "cd /app && npm install && npm run dev"

# Configurar aliases de rede para compatibilidade com Nginx
echo "🔗 Configurando aliases de rede..."
docker network disconnect netpilot_netpilot-network netpilot-frontend 2>/dev/null || true
docker network connect --alias frontend netpilot_netpilot-network netpilot-frontend
docker network disconnect netpilot_netpilot-network netpilot-backend 2>/dev/null || true
docker network connect --alias backend netpilot_netpilot-network netpilot-backend

# Aguardar Nginx ficar pronto e reiniciar para reconhecer os novos aliases
echo "🔄 Reiniciando Nginx..."
sleep 2
docker restart netpilot-nginx >/dev/null 2>&1 || echo "⚠️  Nginx não disponível (normal em primeira execução)"

echo ""
echo "✅ Serviços iniciando!"
echo ""
echo "📝 Logs:"
echo "   docker logs -f netpilot-backend"
echo "   docker logs -f netpilot-frontend"
echo ""
echo "🌐 URLs:"
echo "   Produção:  https://netpilot.meadadigital.com"
echo "   Frontend:  http://localhost:3000"
echo "   Backend:   http://localhost:3001"
echo "   Traefik:   http://localhost:8080"
echo ""
echo "💡 Edite arquivos em:"
echo "   ./backend/src/** (hot-reload automático)"
echo "   ./frontend/src/** (hot-reload automático)"
echo ""

# Se modo background, apenas sair
if [ "$BACKGROUND" = true ]; then
  echo "✅ Serviços iniciados em background!"
  echo ""
  echo "Para ver logs:"
  echo "   docker logs -f netpilot-backend"
  echo "   docker logs -f netpilot-frontend"
  echo ""
  echo "Para parar:"
  echo "   ./stop.sh"
  exit 0
fi

# Modo interativo: aguardar e exibir logs
echo "Aguardando 90s para instalar dependências..."
sleep 90
echo ""
echo "Logs ao vivo:"
docker logs -f netpilot-backend &
BACKEND_PID=$!
docker logs -f netpilot-frontend &
FRONTEND_PID=$!

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT

wait
