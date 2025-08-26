# 📋 NetPilot - Blueprint Completo do Sistema

## 🎯 **Visão Geral**

O **NetPilot** é um sistema completo de gerenciamento de proxy reverso e certificados SSL, desenvolvido para automatizar o roteamento de tráfego web e a gestão de certificados HTTPS via Let's Encrypt.

### **Arquitetura Principal**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Services      │
│   Vue 3 +       │◄──►│   Laravel 12    │◄──►│   Nginx +       │
│   Inertia.js    │    │   + Inertia     │    │   Traefik       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## 🏗️ **Estrutura do Banco de Dados**

### **Tabela: domains**
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | bigint | Chave primária |
| `name` | varchar(255) | Nome do domínio (ex: exemplo.com) |
| `description` | text | Descrição opcional |
| `is_active` | boolean | Status ativo/inativo |
| `auto_ssl` | boolean | SSL automático habilitado |
| `dns_records` | json | Registros DNS (A, CNAME, MX, TXT) |
| `created_at` | timestamp | Data de criação |
| `updated_at` | timestamp | Data de atualização |

### **Tabela: proxy_rules**
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | bigint | Chave primária |
| `domain_id` | bigint | FK para domains |
| `source_host` | varchar(255) | Host de origem |
| `source_port` | varchar(10) | Porta de origem |
| `target_host` | varchar(255) | Host de destino |
| `target_port` | varchar(10) | Porta de destino |
| `protocol` | enum | http/https |
| `headers` | json | Headers customizados |
| `priority` | integer | Prioridade (1-1000) |
| `is_active` | boolean | Status ativo/inativo |
| `nginx_config` | text | Configuração Nginx gerada |
| `created_at` | timestamp | Data de criação |
| `updated_at` | timestamp | Data de atualização |

### **Tabela: ssl_certificates**
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | bigint | Chave primária |
| `domain_id` | bigint | FK para domains |
| `domain_name` | varchar(255) | Domínio principal |
| `san_domains` | json | Domínios SAN |
| `status` | enum | pending/valid/expiring/expired/failed |
| `certificate_path` | varchar(255) | Caminho do certificado |
| `private_key_path` | varchar(255) | Caminho da chave privada |
| `chain_path` | varchar(255) | Caminho da cadeia |
| `issued_at` | timestamp | Data de emissão |
| `expires_at` | timestamp | Data de expiração |
| `auto_renew` | boolean | Renovação automática |
| `renewal_days_before` | integer | Dias antes para renovar |
| `last_error` | text | Último erro ocorrido |
| `created_at` | timestamp | Data de criação |
| `updated_at` | timestamp | Data de atualização |

### **Tabela: deployment_logs**
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | bigint | Chave primária |
| `type` | enum | nginx/traefik/ssl_renewal |
| `action` | varchar(50) | deploy/renew/revoke |
| `status` | enum | pending/running/success/failed |
| `payload` | json | Dados da operação |
| `output` | text | Saída do comando |
| `error` | text | Mensagem de erro |
| `started_at` | timestamp | Início da operação |
| `completed_at` | timestamp | Fim da operação |
| `duration` | integer | Duração em segundos |
| `created_at` | timestamp | Data de criação |
| `updated_at` | timestamp | Data de atualização |

### **Tabela: redirect_rules**
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | bigint | Chave primária |
| `domain_id` | bigint | FK para domains |
| `source_path` | varchar(255) | Caminho de origem |
| `target_url` | varchar(500) | URL de destino |
| `status_code` | integer | Código HTTP (301/302) |
| `is_active` | boolean | Status ativo/inativo |
| `created_at` | timestamp | Data de criação |
| `updated_at` | timestamp | Data de atualização |

---

## 🚀 **Funcionalidades Implementadas**

### **1. Gerenciamento de Domínios**
- ✅ **CRUD Completo**: Criar, listar, editar, excluir domínios
- ✅ **Validação**: Nome único, formato válido
- ✅ **Registros DNS**: Configuração de A, CNAME, MX, TXT
- ✅ **SSL Automático**: Opção para certificados automáticos
- ✅ **Status**: Ativar/desativar domínios

### **2. Proxy Reverso**
- ✅ **Regras de Redirecionamento**: Origem → Destino
- ✅ **Protocolos**: HTTP/HTTPS
- ✅ **Portas Configuráveis**: 80, 443, 8080, 3000, 9000
- ✅ **Headers Customizados**: Configuração de headers HTTP
- ✅ **Prioridades**: Sistema de prioridade 1-1000
- ✅ **Configuração Nginx**: Geração automática

### **3. Certificados SSL**
- ✅ **Let's Encrypt**: Integração completa
- ✅ **Domínios SAN**: Subject Alternative Names
- ✅ **Renovação Automática**: Configurável por certificado
- ✅ **Monitoramento**: Status de expiração
- ✅ **Traefik Integration**: Deploy automático

### **4. Logs e Monitoramento**
- ✅ **Deployment Logs**: Histórico de operações
- ✅ **Filtros**: Por tipo, status, data
- ✅ **Limpeza Automática**: Remoção de logs antigos
- ✅ **Dashboard**: Métricas em tempo real

---

## 🛠️ **Services Implementados**

### **NginxService**
```php
// Localização: app/Services/NginxService.php

Funcionalidades:
- deployConfiguration(): Deploy automático das configurações
- generateSiteConfig(): Geração de configurações por domínio
- testConfiguration(): Validação da configuração
- reloadNginx(): Reload do serviço
- getStatus(): Status do Nginx
- validateRule(): Validação de regras
```

### **TraefikService**
```php
// Localização: app/Services/TraefikService.php

Funcionalidades:
- deployConfiguration(): Deploy das configurações SSL
- generateConfiguration(): Configuração principal do Traefik
- generateDynamicConfiguration(): Configurações dinâmicas
- testConfiguration(): Validação
- reloadTraefik(): Reload do serviço
- getStatus(): Status do Traefik
```

### **LetsEncryptService**
```php
// Localização: app/Services/LetsEncryptService.php

Funcionalidades:
- issueCertificate(): Emissão de certificados
- renewCertificate(): Renovação
- revokeCertificate(): Revogação
- checkCertificateStatus(): Verificação de status
- cleanupExpiredCertificates(): Limpeza automática
```

---

## ⚡ **Comandos Artisan**

### **Renovação SSL**
```bash
php artisan ssl:renew [--force] [--dry-run]

Funcionalidades:
- Renovação automática de certificados expirando
- Modo forçado para renovar todos
- Modo dry-run para simulação
- Logging completo de operações
```

### **Deploy Nginx**
```bash
php artisan nginx:deploy [--force] [--dry-run]

Funcionalidades:
- Deploy automático das configurações
- Teste de configuração
- Reload do serviço
- Validação de sintaxe
```

### **Limpeza de Logs**
```bash
php artisan logs:cleanup [--days=30] [--force]

Funcionalidades:
- Remoção de logs antigos
- Configurável por dias
- Confirmação interativa
- Estatísticas de limpeza
```

---

## 🕐 **Agendamento Automático**

### **Configuração no Kernel**
```php
// Localização: app/Console/Kernel.php

Schedule configurado:
- ssl:renew → Diariamente às 2:00 AM
- nginx:deploy → A cada 5 minutos
- logs:cleanup → Semanalmente
```

---

## 🎨 **Frontend - Páginas Implementadas**

### **Dashboard** (`/`)
- ✅ Métricas em tempo real
- ✅ Status dos serviços (Nginx/Traefik)
- ✅ Certificados expirando
- ✅ Logs recentes
- ✅ Estatísticas gerais

### **Domínios** (`/domains`)
- ✅ **Lista**: Paginação, filtros, busca
- ✅ **Criar**: `/domains/create`
- ✅ **Editar**: `/domains/{id}/edit`
- ✅ **Excluir**: Confirmação modal

### **Proxy Reverso** (`/proxy`)
- ✅ **Lista**: Regras ativas/inativas
- ✅ **Criar**: `/proxy/create`
- ✅ **Editar**: `/proxy/{id}/edit`
- ✅ **Toggle**: Ativar/desativar regras
- ✅ **Deploy**: Deploy manual

### **Certificados SSL** (`/ssl`)
- ✅ **Lista**: Status, expiração
- ✅ **Criar**: `/ssl/create`
- ✅ **Renovar**: Renovação manual
- ✅ **Revogar**: Revogação de certificados

### **Logs** (`/logs`)
- ✅ **Lista**: Histórico completo
- ✅ **Filtros**: Tipo, status, data
- ✅ **Detalhes**: Modal com informações completas

---

## 🔧 **Configurações do Sistema**

### **Nginx**
```bash
# Diretórios padrão
/etc/nginx/sites-available/  # Configurações disponíveis
/etc/nginx/sites-enabled/    # Configurações ativas
/var/log/nginx/             # Logs do Nginx
```

### **Traefik**
```bash
# Diretórios padrão
/etc/traefik/traefik.yml    # Configuração principal
/etc/traefik/dynamic/       # Configurações dinâmicas
/etc/traefik/acme.json      # Certificados Let's Encrypt
```

### **Let's Encrypt**
```bash
# Diretórios padrão
/etc/letsencrypt/live/      # Certificados ativos
/etc/letsencrypt/archive/   # Histórico de certificados
/var/log/letsencrypt/       # Logs do certbot
```

---

## 🔒 **Segurança**

### **Validações Implementadas**
- ✅ **CSRF Protection**: Tokens em todos os formulários
- ✅ **Input Validation**: Validação rigorosa de dados
- ✅ **Domain Validation**: Verificação de formato de domínio
- ✅ **Port Validation**: Portas permitidas configuráveis
- ✅ **File Permissions**: Permissões corretas nos arquivos

### **Headers de Segurança**
```nginx
# Headers automáticos no Nginx
X-Real-IP
X-Forwarded-For
X-Forwarded-Proto
X-Forwarded-Host
```

---

## 📊 **Monitoramento**

### **Métricas Disponíveis**
- ✅ **Domínios**: Total, ativos, inativos
- ✅ **Proxy Rules**: Total, ativas, inativas
- ✅ **Certificados**: Total, válidos, expirando, expirados
- ✅ **Redirects**: Total, ativos, inativos
- ✅ **Logs**: Histórico completo de operações

### **Status dos Serviços**
- ✅ **Nginx**: Status, último deploy, uptime
- ✅ **Traefik**: Status, último deploy, uptime
- ✅ **Certificados**: Próximos a expirar

---

## 🚀 **Deploy e Produção**

### **Requisitos do Sistema**
```bash
# Software necessário
- PHP 8.2+
- Laravel 12
- Node.js 18+
- Nginx 1.20+
- Traefik 2.10+
- Certbot (Let's Encrypt)
```

### **Comandos de Deploy**
```bash
# Configuração inicial
composer install --optimize-autoloader --no-dev
npm ci && npm run build
php artisan key:generate
php artisan migrate --force
php artisan storage:link

# Configuração de produção
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Agendamento (crontab)
* * * * * cd /path-to-your-project && php artisan schedule:run >> /dev/null 2>&1
```

---

## 🔄 **Fluxo de Trabalho**

### **1. Adicionar Novo Domínio**
```
1. Acesse /domains/create
2. Preencha nome e descrição
3. Configure registros DNS (opcional)
4. Ative SSL automático (opcional)
5. Salve o domínio
```

### **2. Criar Regra de Proxy**
```
1. Acesse /proxy/create
2. Selecione o domínio
3. Configure origem (host:porta)
4. Configure destino (host:porta)
5. Defina protocolo e prioridade
6. Adicione headers customizados (opcional)
7. Ative a regra
8. Deploy automático do Nginx
```

### **3. Solicitar Certificado SSL**
```
1. Acesse /ssl/create
2. Selecione o domínio
3. Configure domínios SAN (opcional)
4. Configure renovação automática
5. Solicite o certificado
6. Deploy automático no Traefik
```

---

## 📝 **Logs e Troubleshooting**

### **Localização dos Logs**
```bash
# Laravel
storage/logs/laravel.log

# Nginx
/var/log/nginx/access.log
/var/log/nginx/error.log

# Traefik
/var/log/traefik/traefik.log

# Let's Encrypt
/var/log/letsencrypt/letsencrypt.log
```

### **Comandos de Diagnóstico**
```bash
# Testar configuração Nginx
nginx -t

# Status dos serviços
systemctl status nginx
systemctl status traefik

# Verificar certificados
certbot certificates

# Logs em tempo real
tail -f storage/logs/laravel.log
```

---

## 🎯 **Roadmap Futuro**

### **Próximas Funcionalidades**
- [ ] **API REST**: Endpoints para integração externa
- [ ] **Webhooks**: Notificações automáticas
- [ ] **Backup Automático**: Backup das configurações
- [ ] **Multi-tenancy**: Suporte a múltiplos usuários
- [ ] **Docker Integration**: Suporte a containers
- [ ] **Load Balancing**: Balanceamento de carga
- [ ] **Rate Limiting**: Limitação de requisições
- [ ] **Analytics**: Estatísticas de tráfego

### **Melhorias Planejadas**
- [ ] **Interface Mobile**: Responsividade aprimorada
- [ ] **Dark/Light Mode**: Alternância de temas
- [ ] **Notificações Push**: Alertas em tempo real
- [ ] **Export/Import**: Backup de configurações
- [ ] **Template System**: Templates de configuração

---

## 📞 **Suporte**

### **Documentação**
- 📋 **Blueprint**: Este arquivo
- 🔧 **API Docs**: `/docs/api.md` (a ser criado)
- 🎯 **User Guide**: `/docs/user-guide.md` (a ser criado)

### **Troubleshooting**
- 🐛 **Issues**: GitHub Issues
- 💬 **Discussions**: GitHub Discussions
- 📧 **Email**: suporte@netpilot.dev

---

**✨ NetPilot - Sistema completo de gerenciamento de proxy reverso e certificados SSL**

*Desenvolvido com ❤️ usando Laravel 12 + Vue 3 + Inertia.js*
