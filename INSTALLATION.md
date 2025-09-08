# 🚀 NetPilot - Guia de Instalação

## 📋 **Pré-requisitos**

### **Software Necessário**
```bash
- PHP 8.2 ou superior
- Composer 2.x
- Node.js 18.x ou superior
- NPM ou Yarn
- Nginx 1.20+
- SQLite/MySQL/PostgreSQL
- Git
```

### **Serviços Opcionais**
```bash
- Traefik 2.10+ (para SSL automático)
- Certbot (Let's Encrypt)
- Docker + Docker Compose (para desenvolvimento)
```

---

## 🔧 **Instalação Local**

### **1. Clonar o Repositório**
```bash
git clone https://github.com/seu-usuario/netpilot.git
cd netpilot
```

### **2. Instalar Dependências PHP**
```bash
composer install
```

### **3. Instalar Dependências Node.js**
```bash
npm install
# ou
yarn install
```

### **4. Configurar Ambiente**
```bash
# Copiar arquivo de configuração
cp .env.example .env

# Gerar chave da aplicação
php artisan key:generate
```

### **5. Configurar Banco de Dados**

#### **SQLite (Recomendado para desenvolvimento)**
```bash
# No arquivo .env
DB_CONNECTION=sqlite
DB_DATABASE=/caminho/absoluto/para/database.sqlite

# Criar arquivo do banco
touch database/database.sqlite
```

#### **MySQL**
```bash
# No arquivo .env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=netpilot
DB_USERNAME=seu_usuario
DB_PASSWORD=sua_senha
```

### **6. Executar Migrações**
```bash
php artisan migrate
```

### **7. Popular com Dados de Exemplo**
```bash
php artisan db:seed
```

### **8. Criar Link Simbólico para Storage**
```bash
php artisan storage:link
```

### **9. Iniciar Servidor de Desenvolvimento**
```bash
# Terminal 1 - Laravel
php artisan serve

# Terminal 2 - Vite (assets)
npm run dev
```

### **10. Acessar o Sistema**
```
http://localhost:8000
```

---

## 🐳 **Instalação com Docker (Laravel Sail)**

### **1. Clonar e Configurar**
```bash
git clone https://github.com/seu-usuario/netpilot.git
cd netpilot
cp .env.example .env
```

### **2. Instalar Dependências via Docker**
```bash
docker run --rm \
    -u "$(id -u):$(id -g)" \
    -v "$(pwd):/var/www/html" \
    -w /var/www/html \
    laravelsail/php82-composer:latest \
    composer install --ignore-platform-reqs
```

### **3. Configurar Sail**
```bash
# No arquivo .env
APP_PORT=80
VITE_PORT=5173
```

### **4. Iniciar Containers**
```bash
./vendor/bin/sail up -d
```

### **5. Configurar Aplicação**
```bash
./vendor/bin/sail artisan key:generate
./vendor/bin/sail artisan migrate
./vendor/bin/sail artisan db:seed
./vendor/bin/sail artisan storage:link
```

### **6. Instalar Dependências Node.js**
```bash
./vendor/bin/sail npm install
./vendor/bin/sail npm run dev
```

### **7. Acessar o Sistema**
```
http://localhost
```

---

## 🌐 **Instalação em Produção**

### **1. Preparar Servidor**
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y php8.2 php8.2-fpm php8.2-mysql php8.2-xml php8.2-mbstring php8.2-curl php8.2-zip php8.2-gd
sudo apt install -y nginx mysql-server composer nodejs npm

# CentOS/RHEL
sudo yum install -y php82 php82-fpm php82-mysql php82-xml php82-mbstring php82-curl php82-zip php82-gd
sudo yum install -y nginx mysql-server composer nodejs npm
```

### **2. Configurar Nginx**
```nginx
# /etc/nginx/sites-available/netpilot
server {
    listen 80;
    server_name netpilot.exemplo.com;
    root /var/www/netpilot/public;
    index index.php;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.ht {
        deny all;
    }
}
```

### **3. Ativar Site**
```bash
sudo ln -s /etc/nginx/sites-available/netpilot /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### **4. Clonar e Configurar**
```bash
cd /var/www
sudo git clone https://github.com/seu-usuario/netpilot.git
cd netpilot
sudo chown -R www-data:www-data .
sudo chmod -R 755 .
```

### **5. Instalar Dependências**
```bash
composer install --optimize-autoloader --no-dev
npm ci
npm run build
```

### **6. Configurar Ambiente**
```bash
cp .env.example .env
php artisan key:generate

# Editar .env com configurações de produção
APP_ENV=production
APP_DEBUG=false
APP_URL=https://netpilot.exemplo.com
```

### **7. Configurar Banco de Dados**
```bash
php artisan migrate --force
php artisan db:seed --force
```

### **8. Otimizar para Produção**
```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan storage:link
```

### **9. Configurar Permissões**
```bash
sudo chown -R www-data:www-data storage bootstrap/cache
sudo chmod -R 775 storage bootstrap/cache
```

### **10. Configurar Cron**
```bash
sudo crontab -e
# Adicionar linha:
* * * * * cd /var/www/netpilot && php artisan schedule:run >> /dev/null 2>&1
```

---

## 🔐 **Configuração SSL (Let's Encrypt)**

### **1. Instalar Certbot**
```bash
# Ubuntu/Debian
sudo apt install -y certbot python3-certbot-nginx

# CentOS/RHEL
sudo yum install -y certbot python3-certbot-nginx
```

### **2. Obter Certificado**
```bash
sudo certbot --nginx -d netpilot.exemplo.com
```

### **3. Configurar Renovação Automática**
```bash
sudo crontab -e
# Adicionar linha:
0 12 * * * /usr/bin/certbot renew --quiet
```

---

## 🐋 **Configuração com Traefik**

### **1. Criar docker-compose.yml**
```yaml
version: '3.8'

services:
  traefik:
    image: traefik:v2.10
    command:
      - --api.dashboard=true
      - --providers.docker=true
      - --entrypoints.web.address=:80
      - --entrypoints.websecure.address=:443
      - --certificatesresolvers.letsencrypt.acme.httpchallenge=true
      - --certificatesresolvers.letsencrypt.acme.httpchallenge.entrypoint=web
      - --certificatesresolvers.letsencrypt.acme.email=admin@exemplo.com
      - --certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json
    ports:
      - "80:80"
      - "443:443"
      - "8080:8080"
    volumes:
      - "/var/run/docker.sock:/var/run/docker.sock:ro"
      - "./letsencrypt:/letsencrypt"
    labels:
      - traefik.http.routers.traefik.rule=Host(`traefik.exemplo.com`)
      - traefik.http.routers.traefik.tls.certresolver=letsencrypt

  netpilot:
    build: .
    labels:
      - traefik.http.routers.netpilot.rule=Host(`netpilot.exemplo.com`)
      - traefik.http.routers.netpilot.tls.certresolver=letsencrypt
    environment:
      - APP_ENV=production
      - APP_URL=https://netpilot.exemplo.com
```

### **2. Iniciar Serviços**
```bash
docker-compose up -d
```

---

## Wildcard SSL Certificates

To enable wildcard certificate support:

1. Set `LETSENCRYPT_WILDCARD=true` in your .env
2. Configure your DNS provider credentials:
   - Cloudflare: `CLOUDFLARE_API_KEY`, `CLOUDFLARE_EMAIL`
   - AWS: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`
   - DigitalOcean: `DIGITALOCEAN_TOKEN`
3. Set default provider: `LETSENCRYPT_DNS_PROVIDER=cloudflare`

Usage:
```bash
php artisan ssl:issue --domain=*.example.com --wildcard
```

---

## ⚙️ **Configurações Avançadas**

### **Configuração do NetPilot**

#### **config/nginx.php**
```php
<?php

return [
    'config_path' => env('NGINX_CONFIG_PATH', '/etc/nginx'),
    'sites_available' => env('NGINX_SITES_AVAILABLE', '/etc/nginx/sites-available'),
    'sites_enabled' => env('NGINX_SITES_ENABLED', '/etc/nginx/sites-enabled'),
    'reload_command' => env('NGINX_RELOAD_CMD', 'systemctl reload nginx'),
];
```

#### **config/traefik.php**
```php
<?php

return [
    'config_path' => env('TRAEFIK_CONFIG_PATH', '/etc/traefik'),
    'acme_email' => env('TRAEFIK_ACME_EMAIL', 'admin@example.com'),
    'acme_storage' => env('TRAEFIK_ACME_STORAGE', '/etc/traefik/acme.json'),
];
```

#### **config/letsencrypt.php**
```php
<?php

return [
    'acme_path' => env('LETSENCRYPT_PATH', '/etc/letsencrypt'),
    'certificates_path' => env('LETSENCRYPT_CERTS', '/etc/letsencrypt/live'),
    'email' => env('LETSENCRYPT_EMAIL', 'admin@example.com'),
];
```

### **Variáveis de Ambiente (.env)**
```bash
# NetPilot Configuration
NGINX_CONFIG_PATH=/etc/nginx
TRAEFIK_CONFIG_PATH=/etc/traefik
LETSENCRYPT_EMAIL=admin@exemplo.com

# Paths
NGINX_SITES_AVAILABLE=/etc/nginx/sites-available
NGINX_SITES_ENABLED=/etc/nginx/sites-enabled

# Commands
NGINX_RELOAD_CMD="systemctl reload nginx"
TRAEFIK_RELOAD_CMD="systemctl reload traefik"
```

---

## 🔍 **Verificação da Instalação**

### **1. Testar Conectividade**
```bash
curl -I http://localhost
# Deve retornar: HTTP/1.1 200 OK
```

### **2. Verificar Banco de Dados**
```bash
php artisan migrate:status
# Deve mostrar todas as migrations como "Ran"
```

### **3. Testar Comandos**
```bash
php artisan ssl:renew --dry-run
php artisan nginx:deploy --dry-run
php artisan logs:cleanup --dry-run
```

### **4. Verificar Agendamento**
```bash
php artisan schedule:list
# Deve mostrar as tarefas agendadas
```

### **5. Acessar Dashboard**
```
http://localhost (desenvolvimento)
https://netpilot.exemplo.com (produção)
```

---

## 🚨 **Solução de Problemas**

### **Erro: "Class not found"**
```bash
composer dump-autoload
php artisan config:clear
php artisan cache:clear
```

### **Erro: "Permission denied"**
```bash
sudo chown -R www-data:www-data storage bootstrap/cache
sudo chmod -R 775 storage bootstrap/cache
```

### **Erro: "Vite not found"**
```bash
npm install
npm run build
```

### **Erro: "Database connection"**
```bash
# Verificar configuração no .env
php artisan config:clear
php artisan migrate:status
```

### **Logs para Debug**
```bash
# Laravel
tail -f storage/logs/laravel.log

# Nginx
sudo tail -f /var/log/nginx/error.log

# PHP-FPM
sudo tail -f /var/log/php8.2-fpm.log
```

---

## 📊 **Monitoramento**

### **Status dos Serviços**
```bash
# Verificar se serviços estão rodando
systemctl status nginx
systemctl status php8.2-fpm
systemctl status mysql

# Verificar portas
netstat -tlnp | grep :80
netstat -tlnp | grep :443
```

### **Logs de Aplicação**
```bash
# Monitorar em tempo real
tail -f storage/logs/laravel.log

# Verificar erros recentes
grep ERROR storage/logs/laravel.log | tail -10
```

### **Espaço em Disco**
```bash
# Verificar uso do disco
df -h

# Limpar logs antigos
php artisan logs:cleanup --days=7
```

---

## 🔄 **Atualizações**

### **Atualizar Sistema**
```bash
# Fazer backup
cp -r /var/www/netpilot /var/www/netpilot-backup

# Atualizar código
git pull origin main

# Atualizar dependências
composer install --optimize-autoloader --no-dev
npm ci && npm run build

# Executar migrações
php artisan migrate --force

# Limpar cache
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

### **Rollback (se necessário)**
```bash
# Restaurar backup
rm -rf /var/www/netpilot
mv /var/www/netpilot-backup /var/www/netpilot

# Restaurar banco de dados
php artisan migrate:rollback
```

---

**✨ NetPilot instalado e funcionando!**

*Para usar o sistema, consulte o [Guia do Usuário](USER-GUIDE.md)*
