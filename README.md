# NetPilot 🚀

Sistema completo de Proxy Reverso e Gestão SSL com interface web moderna, desenvolvido com NestJS e Next.js.

![NetPilot Dashboard](https://img.shields.io/badge/Status-Ready-green) ![Docker](https://img.shields.io/badge/Docker-Compose-blue) ![License](https://img.shields.io/badge/License-MIT-yellow)

## 📋 Características

### 🌐 Gestão de Domínios
- ✅ Cadastro e configuração de domínios
- ✅ SSL automático com Let's Encrypt
- ✅ Forçar HTTPS e redirecionamento WWW
- ✅ Controle de acesso interno/externo
- ✅ Configurações de bind IP

### 🔄 Proxy Reverso
- ✅ Regras de proxy com prioridades
- ✅ Suporte a wildcards e padrões
- ✅ Manutenção de query strings
- ✅ Aplicação dinâmica de configurações
- ✅ Integração com Nginx e Traefik

### 🔀 Sistema de Redirects
- ✅ Redirects 301 (permanente) e 302 (temporário)
- ✅ Suporte a padrões e regex
- ✅ Prioridades configuráveis
- ✅ Gestão por domínio

### 🔐 Certificados SSL
- ✅ Renovação automática Let's Encrypt
- ✅ Certificados multi-domínio (SAN)
- ✅ Monitoramento de expiração
- ✅ Dashboard de status
- ✅ Configuração de prazo para renovação

### 📊 Dashboard e Logs
- ✅ Métricas em tempo real
- ✅ Status dos serviços (Nginx, Traefik, Database)
- ✅ Logs de deployment e operações
- ✅ Histórico de renovações SSL
- ✅ Alertas de certificados expirando

### 🔒 Autenticação e Segurança
- ✅ Autenticação JWT
- ✅ Controle de acesso por roles
- ✅ Rate limiting
- ✅ Headers de segurança
- ✅ Validação de dados

## 🏗️ Arquitetura

```
netpilot/
├── docker-compose.yml          # Orquestração de containers
├── backend/                    # API NestJS
│   ├── src/
│   │   ├── modules/           # Módulos funcionais
│   │   ├── entities/          # Entidades do banco
│   │   ├── dtos/              # Data Transfer Objects
│   │   ├── guards/            # Guardas de autenticação
│   │   └── services/          # Serviços de negócio
├── frontend/                   # Interface Next.js
│   ├── src/
│   │   ├── app/              # Páginas da aplicação
│   │   ├── components/       # Componentes reutilizáveis
│   │   ├── hooks/            # React Hooks customizados
│   │   ├── store/            # Gerenciamento de estado
│   │   └── lib/              # Utilitários e API
├── configs/                    # Configurações
│   ├── nginx/                # Templates Nginx
│   ├── traefik/              # Configurações Traefik
│   └── ssl/                  # Certificados SSL
└── scripts/                   # Scripts de automação
```

## 🚀 Inicio Rápido

### Pré-requisitos
- Docker & Docker Compose
- Git
- Portas 80, 443, 3000, 3001, 5432, 8080, 8081 disponíveis

### 1. Clone o Repositório
```bash
git clone https://github.com/seu-usuario/netpilot.git
cd netpilot
```

### 2. Configure as Variáveis de Ambiente
```bash
cp .env.example .env
# Edite o arquivo .env com suas configurações
```

### 3. Inicie os Serviços
```bash
# Construir e iniciar todos os containers
docker-compose up -d --build

# Inicializar banco de dados (primeira execução)
./scripts/init-database.sh

# Verificar logs
docker-compose logs -f
```

### 4. Acesse a Interface
- **NetPilot Dashboard**: http://meadadigital.com:3000
- **API Documentation**: http://meadadigital.com:3001/api/docs
- **Traefik Dashboard**: http://meadadigital.com:8080
- **Nginx Status**: http://meadadigital.com:8081

### 5. Login Inicial
- **Email**: admin@netpilot.local
- **Senha**: admin123

## 🗄️ **Gerenciamento do Banco de Dados**

### Scripts Disponíveis

```bash
# Inicializar banco (criar tabelas e dados iniciais)
./scripts/init-database.sh

# Reset completo do banco (⚠️ APAGA TUDO)
./scripts/reset-database.sh

# Executar apenas seeds
cd backend && npm run seed

# Scripts via npm (dentro da pasta backend)
npm run db:init    # Inicializar banco
npm run db:reset   # Reset banco
npm run seed       # Executar seeds
```

### Estrutura do Banco

O banco PostgreSQL é automaticamente configurado com:

- **Tabelas**: `users`, `domains`, `proxy_rules`, `redirects`, `ssl_certificates`, `logs`, `ssh_sessions`, `console_logs`
- **Tipos Customizados**: `log_type`, `log_status`, `redirect_type`, `certificate_status`
- **Dados Iniciais**: Usuário admin, domínios de exemplo, logs de exemplo
- **Relacionamentos**: Foreign keys e constraints automáticos

### Comandos de Banco Úteis

```bash
# Verificar status das tabelas
docker-compose exec -T db psql -U netpilot -d netpilot -c "\dt"

# Ver registros em todas as tabelas
docker-compose exec -T db psql -U netpilot -d netpilot -c "
SELECT 'users' as tabela, count(*) as registros FROM users
UNION ALL SELECT 'domains', count(*) FROM domains
UNION ALL SELECT 'proxy_rules', count(*) FROM proxy_rules
UNION ALL SELECT 'redirects', count(*) FROM redirects
UNION ALL SELECT 'ssl_certificates', count(*) FROM ssl_certificates
UNION ALL SELECT 'logs', count(*) FROM logs;
"

# Backup do banco
docker-compose exec db pg_dump -U netpilot netpilot > backup.sql

# Restaurar backup
docker-compose exec -T db psql -U netpilot -d netpilot < backup.sql
```

## 🔧 Configuração

### Variáveis de Ambiente Principais

```env
# Database
DATABASE_URL=postgresql://netpilot:netpilot123@db:5432/netpilot

# Backend
JWT_SECRET=seu_jwt_secret_super_seguro
JWT_EXPIRES_IN=7d

# ACME/Let's Encrypt
ACME_EMAIL=seu-email@exemplo.com
ACME_STAGING=false  # true para testes

# Frontend
NEXT_PUBLIC_API_URL=http://meadadigital.com:3001
```

### Configurações Nginx

O NetPilot gera automaticamente configurações Nginx baseadas nos domínios e regras cadastradas. Os arquivos são criados em:

```
configs/nginx/
├── nginx.conf          # Configuração principal
├── default.conf        # Configuração padrão
└── *.conf             # Configurações por domínio
```

### Configurações Traefik

As configurações dinâmicas do Traefik são geradas em:

```
configs/traefik/
└── dynamic.yml         # Routers, services e middlewares
```

## 📡 API Endpoints

### Autenticação
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Registro
- `GET /api/auth/profile` - Perfil do usuário

### Domínios
- `GET /api/domains` - Listar domínios
- `POST /api/domains` - Criar domínio
- `GET /api/domains/:id` - Obter domínio
- `PATCH /api/domains/:id` - Atualizar domínio
- `DELETE /api/domains/:id` - Remover domínio

### Proxy Rules
- `GET /api/proxy-rules` - Listar regras
- `POST /api/proxy-rules` - Criar regra
- `POST /api/proxy-rules/apply-configuration` - Aplicar configuração

### Redirects
- `GET /api/redirects` - Listar redirects
- `POST /api/redirects` - Criar redirect

### SSL Certificates
- `GET /api/ssl-certificates` - Listar certificados
- `POST /api/ssl-certificates` - Criar certificado
- `POST /api/ssl-certificates/:id/renew` - Renovar certificado
- `POST /api/ssl-certificates/renew-expired` - Renovar expirados

### Logs & Dashboard
- `GET /api/logs` - Listar logs
- `GET /api/dashboard/stats` - Estatísticas do dashboard
- `GET /api/dashboard/recent-logs` - Logs recentes

## 🔒 Segurança

### Headers de Segurança
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- Referrer-Policy: strict-origin-when-cross-origin

### Rate Limiting
- API geral: 100 requests/minuto
- Login: 5 tentativas/minuto
- Burst protection configurável

### SSL/TLS
- TLS 1.2+ obrigatório
- Cipher suites seguros
- HSTS habilitado
- Renovação automática de certificados

## 🐳 Docker Services

| Service | Porta | Descrição |
|---------|-------|-----------|
| backend | 3001 | API NestJS |
| frontend | 3000 | Interface Next.js |
| db | 5432 | PostgreSQL Database |
| traefik | 80/443/8080 | Proxy Reverso Principal |
| nginx | 8081 | Web Server |

## 🔧 Desenvolvimento

### Executar em Modo Dev
```bash
# Backend
cd backend
npm install
npm run start:dev

# Frontend
cd frontend
npm install
npm run dev
```

### Executar Testes
```bash
# Backend
cd backend
npm run test
npm run test:e2e

# Frontend
cd frontend
npm run test
```

### Build de Produção
```bash
# Backend
cd backend
npm run build

# Frontend
cd frontend
npm run build
```

## 📊 Monitoramento

### Health Checks
- Database: Conexão PostgreSQL
- Backend: Endpoint `/api/health`
- Frontend: Servidor Next.js
- Nginx: Endpoint `/health`

### Logs
```bash
# Logs de todos os serviços
docker-compose logs -f

# Logs específicos
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f traefik
```

### Métricas
- Uptime dos serviços
- Status dos certificados SSL
- Contadores de logs por tipo
- Estatísticas de domínios e regras

## 🚨 Troubleshooting

### Problemas Comuns

**1. Containers não iniciam**
```bash
# Verificar portas em uso
netstat -tulpn | grep :3000
netstat -tulpn | grep :3001

# Reconstruir containers
docker-compose down
docker-compose up -d --build
```

**2. Banco de dados não conecta**
```bash
# Verificar status do PostgreSQL
docker-compose logs db

# Resetar banco
docker-compose down -v
docker-compose up -d
```

**3. SSL não funciona**
```bash
# Verificar logs do Traefik
docker-compose logs traefik

# Verificar configuração ACME
cat configs/traefik/dynamic.yml
```

**4. Nginx retorna 502**
```bash
# Verificar logs
docker-compose logs nginx

# Verificar configurações geradas
ls -la configs/nginx/
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 🙏 Agradecimentos

- [NestJS](https://nestjs.com/) - Framework backend
- [Next.js](https://nextjs.org/) - Framework frontend
- [Traefik](https://traefik.io/) - Proxy reverso moderno
- [Nginx](https://nginx.org/) - Web server de alta performance
- [Let's Encrypt](https://letsencrypt.org/) - Certificados SSL gratuitos
- [Tailwind CSS](https://tailwindcss.com/) - Framework CSS

---

**Made with ❤️ for DevOps and System Administrators**

Para suporte, abra uma issue no GitHub ou entre em contato com a equipe de desenvolvimento.