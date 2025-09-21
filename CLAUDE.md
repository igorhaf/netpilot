# CLAUDE.md

Este arquivo fornece orientações ao Claude Code quando trabalhando com o código neste repositório.

## Visão Geral do Projeto

Este é o projeto "NetPilot" - um sistema completo de proxy reverso e gestão SSL com interface web moderna.

## Arquitetura do Sistema

### Backend (NestJS)
- **Localização**: `./backend/`
- **Framework**: NestJS com TypeScript
- **Banco de dados**: PostgreSQL com TypeORM
- **Autenticação**: JWT
- **Porta**: 3001

**Módulos principais**:
- `auth` - Autenticação e autorização
- `domains` - Gestão de domínios
- `proxy-rules` - Regras de proxy reverso
- `redirects` - Redirecionamentos
- `ssl-certificates` - Certificados SSL
- `logs` - Sistema de logs
- `dashboard` - Métricas e estatísticas

### Frontend (Next.js)
- **Localização**: `./frontend/`
- **Framework**: Next.js 14 com TypeScript
- **Styling**: Tailwind CSS
- **Estado**: Zustand
- **Queries**: TanStack Query
- **Porta**: 3000

**Páginas principais**:
- `/login` - Autenticação
- `/dashboard` - Painel principal
- `/domains` - Gestão de domínios
- `/proxy-rules` - Regras de proxy
- `/redirects` - Redirecionamentos
- `/ssl-certificates` - Certificados SSL
- `/logs` - Visualização de logs

### Infraestrutura
- **Traefik**: Proxy reverso principal (portas 8090, 8443, 8080)
- **Nginx**: Web server secundário (porta 3010)
- **PostgreSQL**: Banco de dados (porta 5432)
- **Docker Compose**: Orquestração de containers

## Comandos de Desenvolvimento

### Inicialização Rápida
```bash
# Setup automático (recomendado)
./scripts/setup.sh

# Ou manual
cp .env.example .env
docker-compose up -d --build
```

### Backend
```bash
cd backend
npm install
npm run start:dev     # Desenvolvimento
npm run build        # Build de produção
npm run test         # Testes
npm run lint         # Linting
```

### Frontend
```bash
cd frontend
npm install
npm run dev          # Desenvolvimento
npm run build        # Build de produção
npm run lint         # Linting
npm run type-check   # Verificação de tipos
```

### Docker
```bash
docker-compose up -d --build  # Iniciar todos os serviços
docker-compose logs -f        # Ver logs
docker-compose down           # Parar serviços
docker-compose ps             # Status dos containers
```

## Estrutura de Dados

### Entidades Principais
- **User**: Usuários do sistema
- **Domain**: Domínios configurados
- **ProxyRule**: Regras de proxy reverso
- **Redirect**: Redirecionamentos
- **SslCertificate**: Certificados SSL
- **Log**: Logs do sistema

### Relacionamentos
- Domain → ProxyRule (1:N)
- Domain → Redirect (1:N)
- Domain → SslCertificate (1:N)

## Credenciais Padrão

**Login inicial**:
- Email: `admin@netpilot.local`
- Senha: `admin123`

## URLs de Acesso

- **Interface Principal**: http://meadadigital.com:3000
- **API Documentation**: http://meadadigital.com:3001/api/docs
- **Traefik Dashboard**: http://meadadigital.com:8080
- **Nginx Status**: http://meadadigital.com:3010

## Scripts Utilitários

- `./scripts/setup.sh` - Configuração inicial automática
- `./scripts/backup.sh` - Backup dos dados

## Configurações

### Nginx
- Templates em `configs/nginx/`
- Configurações geradas automaticamente por domínio

### Traefik
- Configuração dinâmica em `configs/traefik/dynamic.yml`
- Auto-discovery de serviços
- Integração Let's Encrypt

### SSL
- Certificados armazenados em `configs/ssl/`
- Renovação automática via Let's Encrypt
- Configurações por domínio

## Desenvolvimento

### Adicionar Nova Funcionalidade
1. **Backend**: Criar módulo em `backend/src/modules/`
2. **Frontend**: Criar página em `frontend/src/app/`
3. **Tipo**: Adicionar em `frontend/src/types/`
4. **API**: Documentar endpoint

### Testes
- Backend: Jest + Supertest
- Frontend: React Testing Library
- E2E: Cypress (futuro)

### Padrões de Código
- **Backend**: NestJS conventions, DTOs para validação
- **Frontend**: React Hooks, componentes funcionais
- **Styling**: Tailwind classes, design system consistente

## Deployment

### Produção
```bash
# Build para produção
docker-compose -f docker-compose.prod.yml up -d --build

# Variáveis de ambiente importantes
NODE_ENV=production
ACME_STAGING=false
JWT_SECRET=<secret-forte>
```

### Backup
```bash
./scripts/backup.sh
```

## Troubleshooting

### Problemas Comuns
- **Portas ocupadas**: Verificar `netstat -tulpn`
- **Banco não conecta**: `docker-compose logs db`
- **SSL falha**: Verificar logs Traefik
- **502 Nginx**: Verificar configurações geradas

### Logs
```bash
# Todos os serviços
docker-compose logs -f

# Serviço específico
docker-compose logs -f backend
docker-compose logs -f frontend
```

## Recursos

- **NestJS Docs**: https://nestjs.com/
- **Next.js Docs**: https://nextjs.org/docs
- **Traefik Docs**: https://doc.traefik.io/traefik/
- **Tailwind CSS**: https://tailwindcss.com/docs