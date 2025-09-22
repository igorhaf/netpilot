# Módulo Docker - NetPilot

## Visão Geral

O módulo Docker integra funcionalidades completas de administração Docker ao NetPilot, permitindo gerenciar containers, volumes, redes e imagens através de uma interface web moderna e intuitiva.

## Funcionalidades Implementadas

### ✅ Backend (NestJS)

#### Entidades de Banco
- **DockerJob**: Jobs assíncronos (backup, restore, pull, prune)
- **DockerBackup**: Backups versionados de volumes
- **DockerEvent**: Log de auditoria de todas as ações
- **DockerQuota**: Limites por usuário

#### Serviços
- **DockerService**: Adapter principal para Docker SDK
- **ContainersService**: Lógica de negócio para containers
- **VolumesService**: Gestão de volumes e backups
- **NetworksService**: Administração de redes
- **ImagesService**: Gerenciamento de imagens
- **JobsService**: Processamento de jobs assíncronos
- **DockerEventsService**: Sistema de auditoria
- **DockerMetricsService**: Métricas Prometheus

#### Controllers (API REST)
- **ContainersController**: CRUD completo + ações (start/stop/restart/logs/exec/stats)
- **VolumesController**: CRUD + backup/restore
- **NetworksController**: CRUD + connect/disconnect
- **ImagesController**: CRUD + pull/prune
- **JobsController**: Status de jobs assíncronos

#### Segurança
- **RBAC**: 3 níveis (Viewer, Operator, Admin)
- **Rate Limiting**: 10 ações/minuto por usuário
- **Quotas**: Limites configuráveis por usuário
- **Auditoria**: Log completo de todas as ações

### ✅ Frontend (Next.js 14)

#### Páginas Implementadas
- **Dashboard Docker**: Resumo geral + links rápidos
- **Lista de Containers**: Filtros, paginação, ações em lote
- **Criar Container**: Formulário completo com volumes, portas, env vars
- **Lista de Volumes**: Gestão + backup/restore
- **Terminal**: Interface para exec interativo (estrutura criada)
- **Logs**: Visualização em tempo real (estrutura criada)

#### Componentes UI
- **Cards de Status**: Resumos visuais
- **Tabelas Dinâmicas**: Com filtros e paginação
- **Formulários Complexos**: Multi-step com validação
- **Badges de Status**: Indicadores visuais
- **Progress Bars**: Para jobs assíncronos

### ✅ Infraestrutura

#### Docker Compose
- **Redis**: Para jobs e cache
- **Volume Mounting**: Socket Docker + diretório backups
- **Health Checks**: Verificação de serviços
- **Networks**: Isolamento de rede

#### Configurações
- **Variáveis de Ambiente**: Docker socket, Redis, paths
- **Migrações**: Criação automática das tabelas
- **Dependências**: Dockerode, Bull, Prometheus, Redis

## Estrutura de Arquivos

```
backend/src/modules/docker/
├── controllers/          # API endpoints
├── services/            # Lógica de negócio
├── entities/            # Entidades TypeORM
├── dto/                 # Validação de entrada
├── guards/              # Segurança (RBAC, quotas)
├── interfaces/          # Contratos TypeScript
└── docker.module.ts     # Configuração do módulo

frontend/src/app/(authenticated)/docker/
├── page.tsx             # Dashboard
├── containers/          # Gestão de containers
├── volumes/             # Gestão de volumes
├── networks/            # Gestão de redes (futuro)
└── images/              # Gestão de imagens (futuro)
```

## Como Usar

### 1. Configuração Inicial

```bash
# Copiar configurações
cp .env.example .env

# Instalar dependências backend
cd backend && npm install

# Instalar dependências frontend
cd frontend && npm install

# Executar migrações
cd backend && npm run migration:run
```

### 2. Desenvolvimento

```bash
# Iniciar serviços (PostgreSQL + Redis)
docker-compose up -d db redis

# Backend
cd backend && npm run start:dev

# Frontend
cd frontend && npm run dev
```

### 3. Produção

```bash
# Build completo
docker-compose up -d --build
```

## Endpoints da API

### Containers
- `GET /api/v1/docker/containers` - Listar containers
- `POST /api/v1/docker/containers` - Criar container
- `GET /api/v1/docker/containers/:id` - Inspecionar container
- `POST /api/v1/docker/containers/:id/actions/:action` - Ações (start/stop/restart)
- `DELETE /api/v1/docker/containers/:id` - Remover container
- `GET /api/v1/docker/containers/:id/logs` - Logs do container
- `POST /api/v1/docker/containers/:id/exec` - Executar comando
- `GET /api/v1/docker/containers/:id/stats` - Estatísticas

### Volumes
- `GET /api/v1/docker/volumes` - Listar volumes
- `POST /api/v1/docker/volumes` - Criar volume
- `GET /api/v1/docker/volumes/:name` - Inspecionar volume
- `DELETE /api/v1/docker/volumes/:name` - Remover volume
- `POST /api/v1/docker/volumes/:name/backup` - Criar backup
- `GET /api/v1/docker/volumes/:name/backups` - Listar backups

### Jobs
- `GET /api/v1/docker/jobs` - Listar jobs
- `GET /api/v1/docker/jobs/:id` - Status do job

## Segurança

### Níveis de Permissão

1. **Viewer**: Apenas leitura
   - Listar containers, volumes, redes, imagens
   - Ver logs e estatísticas
   - Inspecionar recursos

2. **Operator**: Ações não-destrutivas
   - Todas as permissões de Viewer
   - Start/stop/restart containers
   - Criar containers, volumes, redes
   - Backup de volumes
   - Conectar/desconectar redes

3. **Admin**: Acesso completo
   - Todas as permissões de Operator
   - Remover containers, volumes, redes, imagens
   - Prune (limpeza) de recursos
   - Forçar remoção

### Rate Limiting
- 10 ações por minuto por usuário (configurável)
- Cache de 1 minuto para bloqueio

### Quotas por Usuário
- Máximo de containers: 10
- Máximo de volumes: 5
- Máximo de redes: 3
- Tamanho máximo de volume: 5GB
- Timeout de exec: 30 minutos

## Monitoramento

### Métricas Prometheus
- `docker_container_actions_total`: Total de ações por tipo
- `docker_container_action_duration_seconds`: Duração das ações
- `docker_active_containers`: Containers ativos por estado
- `docker_volume_usage_bytes`: Uso de volumes em bytes
- `docker_jobs_active`: Jobs ativos por tipo
- `docker_api_requests_total`: Requisições da API

### Logs de Auditoria
Todas as ações são registradas na tabela `docker_events`:
- Usuário que executou
- Tipo de ação
- Recurso afetado
- Resultado (sucesso/erro)
- IP e User-Agent
- Timestamp

## Jobs Assíncronos

### Tipos de Jobs
1. **Backup**: Criação de backup de volume
2. **Restore**: Restauração de backup
3. **Pull**: Download de imagem
4. **Prune**: Limpeza de recursos

### Acompanhamento
- Status em tempo real via polling
- Progress bars na UI
- Notificações de conclusão
- Logs detalhados

## Próximas Implementações

### 🔄 Em Desenvolvimento
- **WebSocket**: Logs e terminal em tempo real
- **Testes**: Cobertura 80%+ com Testcontainers
- **Backup Real**: Implementação com tar + verificação hash

### 📋 Backlog
- **Networks**: Interface completa
- **Images**: Interface completa
- **Compose**: Deploy de stacks
- **Registry**: Integração com registries privados
- **Swarm**: Suporte a Docker Swarm
- **Monitoring**: Dashboard Grafana
- **Alertas**: Notificações automáticas

## Troubleshooting

### Problemas Comuns

1. **Docker socket não acessível**
   ```bash
   sudo chmod 666 /var/run/docker.sock
   ```

2. **Redis não conecta**
   ```bash
   docker-compose logs redis
   ```

3. **Jobs não processam**
   ```bash
   # Verificar se Redis está rodando
   docker-compose ps redis
   ```

4. **Permissões negadas**
   - Verificar role do usuário
   - Verificar quotas configuradas

### Logs Úteis
```bash
# Backend logs
docker-compose logs backend

# Jobs Redis
docker-compose exec redis redis-cli monitor

# Docker daemon
sudo journalctl -u docker.service
```

## Contribuição

1. Fazer fork do projeto
2. Criar branch para feature (`git checkout -b feature/nova-funcionalidade`)
3. Implementar com testes
4. Commit seguindo convenção (`feat: adicionar funcionalidade X`)
5. Push e abrir Pull Request

## Licença

MIT - Ver arquivo LICENSE para detalhes.