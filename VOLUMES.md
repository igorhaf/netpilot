# 📦 Gestão de Volumes Persistentes - NetPilot

## ✅ Status: VOLUMES CONFIGURADOS COMO PERSISTENTES

Todos os dados importantes do NetPilot são armazenados em **volumes Docker nomeados**, garantindo **persistência total** mesmo quando containers são removidos.

## 📊 Volumes Configurados

| Volume | Descrição | Dados Armazenados |
|--------|-----------|-------------------|
| `netpilot_postgres_data` | PostgreSQL | Usuários, projetos, jobs, logs, configurações |
| `netpilot_mysql_data` | MySQL | Dados secundários (se usado) |
| `netpilot_redis_data` | Redis | Cache, filas, sessões |
| `netpilot_pgadmin_data` | PgAdmin | Configurações do PgAdmin |
| `netpilot_redisinsight_data` | RedisInsight | Configurações do RedisInsight |
| `netpilot_traefik_letsencrypt` | Traefik | Certificados SSL Let's Encrypt |
| `netpilot_nginx_logs` | Nginx | Logs de acesso e erro |

## 🔒 Garantias de Persistência

### ✅ O QUE É PRESERVADO:

- **Usuários e senhas** (PostgreSQL)
- **Projetos e configurações** (PostgreSQL)
- **Jobs e execuções** (PostgreSQL)
- **Chat e mensagens** (PostgreSQL)
- **Certificados SSL** (Traefik)
- **Cache e filas** (Redis)
- **Logs de acesso** (Nginx)

### ⚠️ O QUE NÃO É PRESERVADO:

- **Código-fonte** (montado via bind mount de `./backend` e `./frontend`)
- **Configurações Nginx/Traefik** (arquivos em `./configs`)
- **Containers parados** (removidos com `./stop.sh` ou `docker-compose down`)

## 🛠️ Comandos Úteis

### Visualizar informações dos volumes
```bash
./volumes-info.sh
```

### Listar volumes
```bash
docker volume ls | grep netpilot
```

### Ver detalhes de um volume
```bash
docker volume inspect netpilot_postgres_data
```

### Ver tamanho dos volumes
```bash
sudo du -sh /var/lib/docker/volumes/netpilot_*
```

### Backup manual de um volume
```bash
docker run --rm \
  -v netpilot_postgres_data:/source:ro \
  -v $(pwd)/backup:/backup \
  alpine \
  tar czf /backup/postgres-$(date +%Y%m%d).tar.gz -C /source .
```

### Restaurar backup de um volume
```bash
docker run --rm \
  -v netpilot_postgres_data:/target \
  -v $(pwd)/backup:/backup \
  alpine \
  sh -c "cd /target && tar xzf /backup/postgres-20241010.tar.gz"
```

## 📝 Cenários de Uso

### 🟢 Parar containers MAS manter dados
```bash
./stop.sh
# Escolha: N (não remover volumes)
```

### 🔴 Parar containers E apagar TODOS os dados
```bash
./stop.sh
# Escolha: S (remover volumes)
```

### 🔄 Reiniciar aplicação (dados mantidos)
```bash
./stop.sh     # N (manter volumes)
./dev.sh      # Inicia novamente com dados preservados
```

### 🗑️ Reset completo do projeto
```bash
./stop.sh     # S (remover volumes)
./dev.sh      # Inicia do zero, banco vazio
```

## 🔐 Backup Automático

### Criar backup de todos os volumes
```bash
./volumes-info.sh
# Escolha: s (criar backup)
```

Os backups são salvos em:
```
./backups/volumes-YYYYMMDD-HHMMSS/
├── netpilot_postgres_data.tar.gz
├── netpilot_mysql_data.tar.gz
├── netpilot_redis_data.tar.gz
└── ...
```

## ⚠️ IMPORTANTE

1. **Volumes são locais**: Ligados à máquina atual, não são sincronizados automaticamente
2. **Backup regular**: Faça backups periódicos dos volumes importantes
3. **Migração**: Para mover para outro servidor, exporte os volumes primeiro
4. **Espaço em disco**: Monitore o espaço usado pelos volumes

## 📚 Documentação Docker Volumes

- https://docs.docker.com/storage/volumes/
- https://docs.docker.com/engine/reference/commandline/volume/

## 🆘 Solução de Problemas

### Volume não aparece
```bash
docker-compose up -d db mysql redis
```

### Volume corrompido
```bash
docker volume rm netpilot_<nome>_data
docker-compose up -d  # Recria volume vazio
```

### Espaço cheio
```bash
# Limpar volumes não usados
docker volume prune

# Verificar tamanho
du -sh /var/lib/docker/volumes/netpilot_*
```
