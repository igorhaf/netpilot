# NetPilot - Proxy Reverso e Gerenciamento SSL

NetPilot é um sistema completo de gerenciamento de proxy reverso e certificados SSL, construído com Laravel 11 e Vue.js 3. Automatiza a configuração do Traefik, gerencia certificados Let's Encrypt e fornece uma interface web intuitiva.

## 🚀 Recursos Principais

- **Gerenciamento de Domínios**: Criação e configuração de domínios
- **SSL Automático**: Certificados Let's Encrypt com renovação automática
- **Proxy Reverso**: Regras de proxy com Traefik
- **Interface Web**: Dashboard Vue.js 3 com Inertia.js

## 📋 Requisitos

- **Docker** (será instalado automaticamente se não estiver presente)
- **Portas 80, 443, 8080, 8484** disponíveis

## ⚡ Instalação Rápida

### Método 1: Script Automatizado (Recomendado)

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/netpilot.git
cd netpilot

# Execute o script de instalação
bash install.sh
```

### Método 2: Manual com Sail

```bash
# Clone e prepare
git clone https://github.com/seu-usuario/netpilot.git
cd netpilot

# Instale dependências
docker run --rm -u "$(id -u):$(id -g)" -v $(pwd):/var/www/html -w /var/www/html laravelsail/php84-composer:latest composer install

# Configure e inicie
cp .env.example .env
./vendor/bin/sail artisan key:generate
./vendor/bin/sail up -d
./vendor/bin/sail artisan migrate --force
./vendor/bin/sail npm install && ./vendor/bin/sail npm run build
```

## 🌐 Configuração de Domínio

1. **Configure DNS**: Aponte seu domínio para o IP do servidor
2. **Abra portas**: 80 e 443 no firewall
3. **Acesse**: http://localhost:8484 (ou IP do servidor:8484)
4. **Crie domínio**: Na interface web, vá em "Domínios" → "Criar" → Marque "Auto SSL"

### Exemplo via interface:
- Nome: `exemplo.com`
- Ativo: ✅
- Auto SSL: ✅
- Salvar

O certificado será gerado automaticamente em ~1 minuto.

## ⚙️ Comandos Úteis

```bash
# Iniciar sistema
./vendor/bin/sail up -d

# Parar sistema
./vendor/bin/sail down

# Ver logs
./vendor/bin/sail logs -f

# Worker de queue (para SSL automático)
./vendor/bin/sail artisan queue:work

# Sincronizar configurações
./vendor/bin/sail artisan proxy:sync

# Verificar certificados
curl -Iv https://seu-dominio.com
```

## 🔄 Manutenção

### Worker de Queue (SSL Automático)

```bash
# Para SSL funcionar automaticamente, mantenha um worker rodando:
./vendor/bin/sail artisan queue:work --verbose
```

### Comandos Principais

```bash
# Renovar certificados
./vendor/bin/sail artisan ssl:renew

# Limpar logs antigos  
./vendor/bin/sail artisan logs:cleanup

# Status do sistema
./vendor/bin/sail artisan system:status
```

## 🐛 Troubleshooting

### SSL não funciona

```bash
# Verificar DNS
dig +short A seu-dominio.com

# Verificar logs
docker logs netpilot-traefik | tail -20

# Forçar nova tentativa
./vendor/bin/sail artisan proxy:sync
```

### Jobs travados

```bash
# Reiniciar worker
./vendor/bin/sail artisan queue:restart

# Limpar queue
./vendor/bin/sail artisan queue:clear
```

## 📊 Logs

```bash
# Ver logs em tempo real
./vendor/bin/sail logs -f

# Logs específicos
docker logs netpilot-traefik -f    # Traefik
./vendor/bin/sail logs laravel.test # Laravel
```

## 🔄 Atualizar Sistema

```bash
# Atualizar código
git pull origin main

# Rebuild containers
./vendor/bin/sail down
./vendor/bin/sail up -d --build

# Aplicar mudanças
./vendor/bin/sail artisan migrate --force
./vendor/bin/sail npm run build
./vendor/bin/sail artisan optimize
```

## 📚 Documentação Adicional

### Blueprint Index

- ARCHITECTURE: [`ARCHITECTURE.md`](./ARCHITECTURE.md)
- MODELS: [`MODELS.md`](./MODELS.md) 
- SERVICES: [`SERVICES.md`](./SERVICES.md)
- COMMANDS: [`COMMANDS.md`](./COMMANDS.md)
- FRONTEND: [`FRONTEND.md`](./FRONTEND.md)
- API: [`API.md`](./API.md)
- INSTALLATION: [`INSTALLATION.md`](./INSTALLATION.md)
- USER-GUIDE: [`USER-GUIDE.md`](./USER-GUIDE.md)

### Estrutura do Sistema

**Backend (Laravel 11):**
- Controllers: Dashboard, Domains, Proxy, SSL, Redirects, Logs, Sync, Upstreams, Routes
- Models: Domain, ProxyRule, RouteRule, Upstream, SslCertificate, RedirectRule, DeploymentLog, CertificateEvent, User
- Services: TraefikService, NginxService, LetsEncryptService, SystemCommandService, ReconcilerService
- Jobs: CreateSslCertificateJob, RenewSslCertificateJob
- Commands: 25+ comandos para SSL, proxy e manutenção

**Frontend (Vue.js 3 + Inertia.js):**
- Páginas: Dashboard, Domains, Proxy, SSL, Redirects, Routes, Upstreams, Logs, Sync
- Componentes: Forms, UI, Status, Modals
- Autenticação: Login/Register integrado

**Infraestrutura:**
- Docker + Laravel Sail
- Traefik v3.0 (proxy principal)
- MySQL/PostgreSQL/SQLite
- Redis (cache/sessions)
- Supervisor (queue workers)

## 🚨 Checklist Pós-Instalação

### ✅ Verificação Inicial

```bash
# 1. Verificar containers rodando
./vendor/bin/sail ps

# 2. Testar acesso à interface
curl -I http://localhost:8484

# 3. Verificar banco de dados
./vendor/bin/sail artisan migrate:status

# 4. Verificar Traefik dashboard
curl -I http://localhost:8080

# 5. Testar worker de queue
./vendor/bin/sail artisan queue:work --once
```

### ✅ Configuração de Produção

```bash
# 1. Configurar supervisor para queues
sudo systemctl enable supervisor
sudo systemctl start supervisor

# 2. Configurar cron jobs
crontab -l | grep artisan || echo "* * * * * cd $(pwd) && ./vendor/bin/sail artisan schedule:run >> /dev/null 2>&1" | crontab -

# 3. Configurar backup automático
./vendor/bin/sail artisan backup:setup

# 4. Testar SSL em domínio real
./vendor/bin/sail artisan ssl:test seu-dominio.com
```

### ✅ Primeiro Domínio SSL

```bash
# Via interface web (recomendado):
# 1. Acesse http://seu-servidor:8484
# 2. Faça login/registro
# 3. Vá em "Domínios" → "Criar"
# 4. Preencha nome do domínio
# 5. Marque "Auto SSL"
# 6. Salve e aguarde certificado

# Via linha de comando:
./vendor/bin/sail artisan domain:create seu-dominio.com --auto-ssl
```

## 📞 Suporte

### Logs para Diagnóstico

Quando reportar problemas, inclua:

```bash
# Informações do sistema
./vendor/bin/sail --version
docker --version
docker-compose --version

# Status dos containers
./vendor/bin/sail ps

# Logs recentes
docker logs netpilot-traefik --tail 50
./vendor/bin/sail artisan log:show --tail 50

# Configuração atual
./vendor/bin/sail artisan config:show
```

### Comunidade e Contribuição

- **Issues**: [GitHub Issues](https://github.com/seu-usuario/netpilot/issues)
- **Documentação**: Contribuições bem-vindas via PR
- **Discord**: [Link do servidor Discord](#)

## 📄 Licença

Este projeto está licenciado sob a [MIT License](./LICENSE).

## 🏆 Créditos

Desenvolvido com ❤️ usando:
- [Laravel](https://laravel.com)
- [Vue.js](https://vuejs.org) 
- [Traefik](https://traefik.io)
- [Let's Encrypt](https://letsencrypt.org)
- [Docker](https://docker.com)

---

## Change Log

- **2025-09-09**: Adicionado guia completo de instalação e configuração
- **2025-08-31**: Criação inicial do projeto e documentação básica

---

**📍 Status**: ✅ Produção - SSL Automático Funcional

## Blueprint Regeneration Checklist

Follow these steps to update any blueprint without overwriting unrelated content:

1. Identify scope
   - Reference the file and section anchors exactly (e.g., `### 1. Domain Model` in `MODELS.md`).
2. Preserve anchors
   - Do not rename existing headings; add new sections using the documented patterns in each file's "Blueprint Maintenance Protocol".
3. Make additive changes
   - Prefer adding clarifications/notes. If changing contracts (fields, routes, signatures), include a dated note with rationale.
4. Cross-file consistency
   - Keep docs aligned with code in: `app/Models/`, `app/Services/`, `app/Http/Controllers/`, `app/Http/Requests/`, `routes/web.php`, and configs in `config/`.
5. Update Change Log
   - Append a dated entry under the "## Change Log" section of the edited blueprint.
6. Minimal examples
   - Link to source paths (e.g., `app/Infra/Traefik/TraefikProvider.php`) instead of duplicating large code blocks.
7. Validate
   - After edits, skim the other blueprints for impacted references and update as needed.

Tip: Each blueprint now begins with its own "Blueprint Maintenance Protocol" summarizing anchors, regeneration rules, and cross-file contracts.

## Project Status Snapshot (2025-08-31)

- Backend
  - Controllers: Dashboard, Domains, Proxy, SSL, Redirects, Logs, Sync, Upstreams, Routes (autenticado)
  - Models: Domain, ProxyRule, RouteRule, Upstream, SslCertificate, RedirectRule, DeploymentLog, CertificateEvent, User
  - Services: TraefikService, NginxService, LetsEncryptService, SystemCommandService, ReconcilerService
  - Commands: conjunto operacional (deploy/sync/ssl/logs) e testes
  - Rotas: protegidas por `auth`, agrupadas em `routes/web.php`

- Frontend (Vue 3 + Inertia)
  - Páginas: Dashboard, Domains (Index/Create/Edit), Proxy (Index/Create/Edit), SSL (Index/Create), Redirects (Index/Create/Edit), Routes (Index/Create/Edit), Upstreams (Index/Create/Edit), Logs (Index), Sync
  - Autenticação: páginas `Auth/Login.vue` e `Auth/Register.vue`

- Infra & Config
  - Traefik Provider em `app/Infra/Traefik/TraefikProvider.php`
  - Diretório dinâmico: `config('netpilot.dynamic_dir')` (default: `docker/traefik/dynamic`)
  - Variáveis de reconciliação: `RECONCILE_ENABLED`, `RECONCILE_INTERVAL`, `EDGE_PROVIDER`

### Próximos Passos Sugeridos

1. Validar `.env` com chaves de Traefik/LE e reconciliação
2. Executar `php artisan migrate --force` no ambiente alvo
3. Rodar `php artisan proxy:sync` e verificar `docker/traefik/dynamic`
4. Testar renovação: `php artisan proxy:renew --dry-run`
5. Revisar páginas de Index para Routes e Upstreams (presentes) e UX de feedback de sync

## Change Log
- 2025-08-31: Adicionado snapshot de status do projeto e próximos passos.
