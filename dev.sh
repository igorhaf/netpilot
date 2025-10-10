#!/bin/bash

# Script de desenvolvimento com hot-reload
set -e

echo "🚀 Modo DESENVOLVIMENTO com hot-reload"
echo ""

# Parar containers antigos
docker stop netpilot-backend netpilot-frontend 2>/dev/null || true
docker rm netpilot-backend netpilot-frontend 2>/dev/null || true

# Garantir infraestrutura
docker-compose up -d db redis mysql
sleep 5

# Obter IPs dos serviços
DB_IP=$(docker inspect -f '{{range.NetworkSettings.Networks}}{{.IPAddress}}{{end}}' netpilot-db 2>/dev/null || echo "")
REDIS_IP=$(docker inspect -f '{{range.NetworkSettings.Networks}}{{.IPAddress}}{{end}}' netpilot-redis 2>/dev/null || echo "")
MYSQL_IP=$(docker inspect -f '{{range.NetworkSettings.Networks}}{{.IPAddress}}{{end}}' netpilot-mysql 2>/dev/null || echo "")

# Se não conseguiu IPs, tentar nomes alternativos
if [ -z "$DB_IP" ]; then
  DB_IP=$(docker inspect -f '{{range.NetworkSettings.Networks}}{{.IPAddress}}{{end}}' e8394d4c95bd_netpilot-db 2>/dev/null || echo "172.19.0.2")
fi
if [ -z "$REDIS_IP" ]; then
  REDIS_IP=$(docker inspect -f '{{range.NetworkSettings.Networks}}{{.IPAddress}}{{end}}' 7b3c19271d78_netpilot-redis 2>/dev/null || echo "172.19.0.3")
fi
if [ -z "$MYSQL_IP" ]; then
  MYSQL_IP=$(docker inspect -f '{{range.NetworkSettings.Networks}}{{.IPAddress}}{{end}}' netpilot-mysql 2>/dev/null || echo "172.19.0.4")
fi

echo "📡 DB: $DB_IP | Redis: $REDIS_IP | MySQL: $MYSQL_IP"

# Backend com hot-reload
echo "🔧 Iniciando backend (hot-reload)..."
docker run -d \
  --name netpilot-backend \
  --network netpilot_netpilot-network \
  -p 3001:3001 \
  -e NODE_ENV=development \
  -e DATABASE_URL=postgresql://netpilot:netpilot123@172.19.0.2:5432/netpilot \
  -e MYSQL_URL=mysql://netpilot:netpilot123@172.19.0.4:3306/netpilot \
  -e JWT_SECRET=netpilot_jwt_secret_key_2024 \
  -e REDIS_HOST=172.19.0.5 \
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

# Reiniciar Nginx para reconhecer os novos aliases
echo "🔄 Reiniciando Nginx..."
docker restart netpilot-nginx >/dev/null 2>&1 || true

echo ""
echo "✅ Serviços iniciando!"
echo ""
echo "📝 Logs:"
echo "   docker logs -f netpilot-backend"
echo "   docker logs -f netpilot-frontend"
echo ""
echo "🌐 URLs:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:3001"
echo ""
echo "💡 Edite arquivos em:"
echo "   ./backend/src/** (hot-reload automático)"
echo "   ./frontend/src/** (hot-reload automático)"
echo ""
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
