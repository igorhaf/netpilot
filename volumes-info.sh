#!/bin/bash

# Script para gerenciar e visualizar volumes do NetPilot

echo "📦 VOLUMES PERSISTENTES DO NETPILOT"
echo "===================================="
echo ""

# Verificar se volumes existem
echo "🔍 Volumes configurados:"
echo ""

volumes=(
  "netpilot_postgres_data:PostgreSQL Database"
  "netpilot_mysql_data:MySQL Database"
  "netpilot_redis_data:Redis Cache"
  "netpilot_pgadmin_data:PgAdmin Config"
  "netpilot_redisinsight_data:RedisInsight Config"
  "netpilot_traefik_letsencrypt:Traefik SSL Certificates"
  "netpilot_nginx_logs:Nginx Logs"
)

total_size=0

for vol_info in "${volumes[@]}"; do
  vol_name=$(echo $vol_info | cut -d: -f1)
  vol_desc=$(echo $vol_info | cut -d: -f2)

  if docker volume inspect $vol_name >/dev/null 2>&1; then
    mountpoint=$(docker volume inspect $vol_name --format '{{ .Mountpoint }}')
    size=$(sudo du -sh $mountpoint 2>/dev/null | cut -f1 || echo "N/A")
    echo "✅ $vol_desc"
    echo "   Nome: $vol_name"
    echo "   Path: $mountpoint"
    echo "   Size: $size"
    echo ""
  else
    echo "❌ $vol_desc"
    echo "   Nome: $vol_name"
    echo "   Status: NÃO CRIADO"
    echo ""
  fi
done

echo "===================================="
echo ""
echo "💡 INFORMAÇÕES IMPORTANTES:"
echo ""
echo "✅ Os volumes são PERSISTENTES - dados não são perdidos ao parar containers"
echo "✅ Use './stop.sh' e escolha 'n' para manter os dados"
echo "⚠️  Use './stop.sh' e escolha 's' para DELETAR TODOS OS DADOS"
echo ""
echo "📝 Comandos úteis:"
echo "   docker volume ls | grep netpilot     # Listar volumes"
echo "   docker volume inspect <nome>         # Detalhes do volume"
echo "   ./backup-volumes.sh                  # Fazer backup (se existir)"
echo ""

# Opção para fazer backup
read -p "❓ Deseja criar backup dos volumes agora? [s/N]: " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Ss]$ ]]; then
  backup_dir="./backups/volumes-$(date +%Y%m%d-%H%M%S)"
  mkdir -p "$backup_dir"

  echo "📦 Criando backup em: $backup_dir"
  echo ""

  for vol_info in "${volumes[@]}"; do
    vol_name=$(echo $vol_info | cut -d: -f1)
    vol_desc=$(echo $vol_info | cut -d: -f2)

    if docker volume inspect $vol_name >/dev/null 2>&1; then
      echo "💾 Backup: $vol_desc..."
      docker run --rm \
        -v $vol_name:/source:ro \
        -v "$(pwd)/$backup_dir:/backup" \
        alpine \
        tar czf /backup/${vol_name}.tar.gz -C /source . 2>/dev/null || echo "⚠️  Erro no backup"
    fi
  done

  echo ""
  echo "✅ Backup concluído em: $backup_dir"
  echo "📊 Arquivos criados:"
  ls -lh "$backup_dir"
else
  echo "ℹ️  Backup cancelado"
fi

echo ""
