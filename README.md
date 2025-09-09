# NetPilot - Proxy Reverso e Gerenciamento SSL

NetPilot é um sistema completo de gerenciamento de proxy reverso e certificados SSL, construído com Laravel 11 e Vue.js 3. Automatiza a configuração do Traefik e Nginx, gerencia certificados Let's Encrypt e fornece uma interface web intuitiva.

## 🚀 Recursos Principais

- **Gerenciamento de Domínios**: Criação e configuração de domínios com DNS
- **Proxy Reverso**: Regras de proxy com Traefik e Nginx
- **SSL Automático**: Certificados Let's Encrypt com renovação automática
- **Redirecionamentos**: Regras de redirect com padrões flexíveis
- **Upstreams**: Configuração de serviços backend com balanceamento
- **Rotas Avançadas**: Roteamento baseado em paths e métodos HTTP
- **Logs Detalhados**: Monitoramento completo de operações
- **Interface Web**: Dashboard Vue.js 3 com Inertia.js

## 📋 Requisitos do Sistema

- **Docker** e **Docker Compose**
- **PHP 8.2+** com extensões: pdo, mysql, redis, zip, gd
- **MySQL 8.0+** ou **PostgreSQL 14+**
- **Node.js 18+** e **NPM**
- **Portas disponíveis**: 80, 443, 8080 (Traefik), 8484 (Laravel)

## 🛠️ Instalação Completa

### 1. Preparação do Servidor

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar dependências básicas
sudo apt install -y curl wget git unzip

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2. Clone e Preparação do Projeto

```bash
# Clonar repositório
git clone https://github.com/seu-usuario/netpilot.git
cd netpilot

# Criar diretórios necessários
mkdir -p traefik/dynamic
mkdir -p storage/certs
mkdir -p storage/letsencrypt

# Criar arquivo ACME com permissões corretas
touch traefik/acme.json
chmod 600 traefik/acme.json

# Permissões dos diretórios dinâmicos
chmod -R 755 traefik/dynamic/
```

### 3. Configuração do Ambiente (.env)

```bash
# Copiar arquivo de exemplo
cp .env.example .env

# Editar .env com suas configurações
nano .env
```

**Configuração essencial do .env:**

```env
APP_NAME=NetPilot
APP_ENV=production
APP_DEBUG=false
APP_URL=http://seu-dominio.com:8484

# Database
DB_CONNECTION=mysql
DB_HOST=mysql
DB_PORT=3306
DB_DATABASE=netpilot
DB_USERNAME=sail
DB_PASSWORD=password

# NetPilot Proxy
PROXY_ENABLED=true
EDGE_PROVIDER=traefik
TRAEFIK_ACME_EMAIL=seu-email@exemplo.com
TRAEFIK_ACME_CA_SERVER=https://acme-v02.api.letsencrypt.org/directory
TRAEFIK_CHALLENGE=HTTP01
PROXY_DYNAMIC_DIR=/var/www/html/traefik/dynamic
TRAEFIK_DYNAMIC_DIR=/var/www/html/traefik/dynamic

# Let's Encrypt
LETSENCRYPT_EMAIL=seu-email@exemplo.com
LETSENCRYPT_CHALLENGE=webroot
LETSENCRYPT_STAGING=false
LETSENCRYPT_WEBROOT=/var/www/html/public
LETSENCRYPT_CERTS_PATH=/var/www/html/storage/certs
LETSENCRYPT_ACME_PATH=/var/www/html/storage/letsencrypt

# Queue
QUEUE_CONNECTION=database
BROADCAST_DRIVER=log

# Cache
CACHE_DRIVER=redis
SESSION_DRIVER=redis
```

### 4. Instalação via Laravel Sail

```bash
# Instalar dependências do Composer
docker run --rm \
    -u "$(id -u):$(id -g)" \
    -v $(pwd):/var/www/html \
    -w /var/www/html \
    laravelsail/php84-composer:latest \
    composer install --optimize-autoloader --no-dev

# Gerar chave da aplicação
./vendor/bin/sail artisan key:generate

# Subir os containers
./vendor/bin/sail up -d

# Executar migrações
./vendor/bin/sail artisan migrate --force

# Instalar dependências do frontend
./vendor/bin/sail npm install

# Compilar assets
./vendor/bin/sail npm run build

# Limpar e otimizar cache
./vendor/bin/sail artisan config:clear
./vendor/bin/sail artisan cache:clear
./vendor/bin/sail artisan view:clear
./vendor/bin/sail artisan optimize
```

### 5. Configuração DNS

**Configure seus domínios para apontar para o IP do servidor:**

```bash
# Verificar IP público do servidor
curl -s ifconfig.me

# Criar registros DNS A/AAAA:
# exemplo.com -> SEU_IP_PUBLICO
# *.exemplo.com -> SEU_IP_PUBLICO (para subdomínios)
```

### 6. Configuração de Firewall

```bash
# Permitir portas necessárias
sudo ufw allow 22/tcp      # SSH
sudo ufw allow 80/tcp      # HTTP (ACME Challenge)
sudo ufw allow 443/tcp     # HTTPS
sudo ufw allow 8080/tcp    # Traefik Dashboard
sudo ufw allow 8484/tcp    # Laravel (opcional, para acesso direto)

# Ativar firewall
sudo ufw --force enable
```

## ⚙️ Configuração SSL Automática

### 1. Verificar Traefik

```bash
# Verificar se Traefik está rodando
./vendor/bin/sail ps

# Verificar logs do Traefik
docker logs netpilot-traefik --tail 50

# Verificar permissões do ACME
ls -la traefik/acme.json
```

### 2. Configurar Domínio para SSL

```bash
# Via interface web em http://seu-servidor:8484
# OU via linha de comando:

./vendor/bin/sail artisan tinker
```

```php
// Criar domínio
$domain = App\Models\Domain::create([
    'name' => 'exemplo.com',
    'is_active' => true,
    'auto_ssl' => true
]);

// Aplicar configuração Traefik
app(App\Services\TraefikService::class)->applyDomain($domain);

// Solicitar certificado SSL
App\Jobs\CreateSslCertificateJob::dispatch($domain->sslCertificates()->create([
    'domain_name' => 'exemplo.com',
    'status' => 'pending'
]));
```

### 3. Verificar Certificado

```bash
# Testar HTTPS
curl -Iv https://seu-dominio.com

# Verificar detalhes do certificado
openssl s_client -servername seu-dominio.com -connect seu-dominio.com:443 -showcerts </dev/null | openssl x509 -noout -text
```

## 🔄 Comandos de Manutenção

### Worker de Queue (Obrigatório)

```bash
# Iniciar worker permanentemente (use supervisord em produção)
./vendor/bin/sail artisan queue:work --verbose --tries=3 --timeout=90

# OU via supervisor (recomendado)
sudo apt install supervisor
sudo nano /etc/supervisor/conf.d/netpilot-worker.conf
```

**Configuração do Supervisor:**

```ini
[program:netpilot-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/html/artisan queue:work --sleep=3 --tries=3 --max-time=3600
directory=/var/www/html
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=sail
numprocs=1
redirect_stderr=true
stdout_logfile=/var/www/html/storage/logs/worker.log
stopwaitsecs=3600
```

### Comandos Úteis

```bash
# Sincronizar configurações do proxy
./vendor/bin/sail artisan proxy:sync

# Verificar status dos certificados SSL
./vendor/bin/sail artisan ssl:check

# Renovar certificados próximos do vencimento
./vendor/bin/sail artisan ssl:renew

# Limpar logs antigos
./vendor/bin/sail artisan logs:cleanup

# Verificar status do sistema
./vendor/bin/sail artisan system:status

# Backup da configuração
./vendor/bin/sail artisan config:backup

# Restaurar configuração
./vendor/bin/sail artisan config:restore backup.json
```

### Cron Jobs

```bash
# Editar crontab
crontab -e

# Adicionar linha:
* * * * * cd /caminho/para/netpilot && ./vendor/bin/sail artisan schedule:run >> /dev/null 2>&1
```

## 🐛 Troubleshooting

### Problema: Certificado SSL não é emitido

```bash
# 1. Verificar logs do Traefik
docker logs netpilot-traefik | grep -E "acme|challenge|certificate"

# 2. Verificar permissões do acme.json
chmod 600 traefik/acme.json
docker restart netpilot-traefik

# 3. Verificar conectividade HTTP
curl -I http://seu-dominio.com

# 4. Verificar DNS
dig +short A seu-dominio.com

# 5. Forçar nova solicitação
./vendor/bin/sail artisan ssl:issue seu-dominio.com --force
```

### Problema: Jobs ficam travados

```bash
# Verificar jobs falhados
./vendor/bin/sail artisan queue:failed

# Reprocessar jobs falhados
./vendor/bin/sail artisan queue:retry all

# Limpar jobs travados
./vendor/bin/sail artisan queue:clear

# Reiniciar worker
./vendor/bin/sail artisan queue:restart
```

### Problema: Traefik não carrega configuração

```bash
# Verificar arquivos dinâmicos
ls -la traefik/dynamic/

# Verificar sintaxe YAML
./vendor/bin/sail artisan proxy:validate

# Forçar regeneração
./vendor/bin/sail artisan proxy:sync --force

# Reiniciar Traefik
docker restart netpilot-traefik
```

### Problema: Permissões de arquivo

```bash
# Corrigir permissões dos diretórios
sudo chown -R $USER:$USER .
chmod -R 755 storage/
chmod -R 755 traefik/dynamic/
chmod 600 traefik/acme.json

# Corrigir permissões do Laravel
./vendor/bin/sail artisan storage:link
chmod -R 775 storage/
chmod -R 775 bootstrap/cache/
```

## 📊 Monitoramento

### Logs Importantes

```bash
# Logs do Laravel
./vendor/bin/sail artisan log:tail

# Logs do Traefik
docker logs netpilot-traefik -f

# Logs do Worker
tail -f storage/logs/worker.log

# Logs do MySQL
docker logs netpilot-mysql-1 -f

# Status dos containers
./vendor/bin/sail ps
```

### Métricas de Sistema

```bash
# Uso de CPU e memória
docker stats

# Espaço em disco
df -h

# Processos do sistema
htop

# Conectividade de rede
netstat -tulpn | grep -E "(80|443|8080|8484)"
```

## 🔒 Segurança

### Configurações de Segurança

```bash
# Configurar fail2ban para SSH
sudo apt install fail2ban
sudo systemctl enable fail2ban

# Configurar backup automático
./vendor/bin/sail artisan backup:run

# Monitorar logs de acesso
tail -f /var/log/nginx/access.log
```

### Atualizações

```bash
# Atualizar código
git pull origin main

# Atualizar dependências
./vendor/bin/sail composer update --no-dev

# Executar migrações
./vendor/bin/sail artisan migrate --force

# Compilar assets
./vendor/bin/sail npm run build

# Limpar cache
./vendor/bin/sail artisan optimize:clear
./vendor/bin/sail artisan optimize

# Reiniciar services
./vendor/bin/sail artisan queue:restart
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
