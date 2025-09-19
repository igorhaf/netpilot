#!/bin/bash

# NetPilot Backup Script
# Este script faz backup dos dados do NetPilot

set -e

BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="netpilot_backup_$DATE"

echo "🗄️  Iniciando backup do NetPilot..."

# Criar diretório de backup
mkdir -p $BACKUP_DIR

# Backup do banco de dados
echo "📊 Fazendo backup do banco de dados..."
docker-compose exec -T db pg_dump -U netpilot netpilot > "$BACKUP_DIR/${BACKUP_NAME}_database.sql"

# Backup das configurações
echo "⚙️  Fazendo backup das configurações..."
tar -czf "$BACKUP_DIR/${BACKUP_NAME}_configs.tar.gz" configs/

# Backup do arquivo .env
echo "🔐 Fazendo backup das variáveis de ambiente..."
cp .env "$BACKUP_DIR/${BACKUP_NAME}_env.backup"

# Criar arquivo de informações
echo "📝 Criando arquivo de informações..."
cat > "$BACKUP_DIR/${BACKUP_NAME}_info.txt" << EOF
NetPilot Backup Information
==========================
Date: $(date)
Version: $(git describe --tags --always 2>/dev/null || echo "unknown")
Commit: $(git rev-parse HEAD 2>/dev/null || echo "unknown")

Services Status:
$(docker-compose ps)

Database Size:
$(docker-compose exec -T db psql -U netpilot -d netpilot -c "SELECT pg_size_pretty(pg_database_size('netpilot'));" -t | xargs)

Files Included:
- ${BACKUP_NAME}_database.sql (Database dump)
- ${BACKUP_NAME}_configs.tar.gz (Configuration files)
- ${BACKUP_NAME}_env.backup (Environment variables)
EOF

echo "✅ Backup concluído: $BACKUP_NAME"
echo "📁 Arquivos salvos em: $BACKUP_DIR"

# Limpar backups antigos (manter últimos 10)
echo "🧹 Limpando backups antigos..."
ls -t $BACKUP_DIR/netpilot_backup_*_info.txt 2>/dev/null | tail -n +11 | while read backup_info; do
    backup_base=$(echo $backup_info | sed 's/_info.txt$//')
    echo "Removendo backup antigo: $(basename $backup_base)"
    rm -f "${backup_base}"*
done

echo "🎉 Backup do NetPilot concluído com sucesso!"