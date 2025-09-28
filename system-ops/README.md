# NetPilot System Operations

Microserviço Python com FastAPI para operações de sistema do NetPilot.

## Visão Geral

Este microserviço fornece APIs para operações de sistema que requerem privilégios elevados, incluindo:

- 🌐 **Nginx Operations**: Geração e gerenciamento de configurações Nginx
- 🔒 **SSL Operations**: Geração, renovação e instalação de certificados SSL
- 👥 **User Management**: Criação de usuários e gerenciamento de sessões terminal
- 🚦 **Traffic Management**: Regras de firewall e controle de tráfego
- 🖥️ **System Operations**: Monitoramento de sistema e gerenciamento de serviços

## Arquitetura

```
system-ops/
├── main.py                    # Aplicação FastAPI principal
├── requirements.txt           # Dependências Python
├── .env.example              # Configurações de exemplo
├── models/                   # Modelos Pydantic
│   ├── nginx.py             # Modelos Nginx
│   ├── ssl.py               # Modelos SSL
│   ├── users.py             # Modelos de usuários
│   └── system.py            # Modelos de sistema
├── services/                # Camada de serviços
│   ├── nginx_service.py     # Operações Nginx
│   ├── ssl_service.py       # Operações SSL
│   ├── user_service.py      # Gerenciamento usuários
│   ├── traffic_service.py   # Gestão de tráfego
│   └── system_service.py    # Operações de sistema
├── routes/                  # Rotas da API
│   ├── nginx_routes.py      # Endpoints Nginx
│   ├── ssl_routes.py        # Endpoints SSL
│   ├── user_routes.py       # Endpoints usuários
│   ├── traffic_routes.py    # Endpoints tráfego
│   └── system_routes.py     # Endpoints sistema
├── templates/               # Templates Jinja2
│   ├── nginx.conf.j2        # Template Nginx
│   └── traefik.yml.j2       # Template Traefik
├── utils/                   # Utilitários
│   ├── system.py            # Utilitários sistema
│   ├── security.py          # Validações segurança
│   └── callbacks.py         # Callbacks para Nest.js
├── systemd/                 # Configuração systemd
│   └── netpilot-system-ops.service
└── tests/                   # Testes
    └── test_main.py         # Testes básicos
```

## Instalação

### 1. Configurar Ambiente

```bash
cd /home/projects/netpilot/system-ops

# Criar ambiente virtual
python3 -m venv venv
source venv/bin/activate

# Instalar dependências
pip install -r requirements.txt

# Configurar variáveis de ambiente
cp .env.example .env
# Editar .env conforme necessário
```

### 2. Configurar Permissões

```bash
# Criar usuário para o serviço (se necessário)
sudo useradd -r -s /bin/false netpilot

# Configurar permissões
sudo chown -R netpilot:netpilot /home/projects/netpilot/system-ops
sudo chmod +x /home/projects/netpilot/system-ops/main.py

# Configurar sudoers para operações privilegiadas
echo "netpilot ALL=(ALL) NOPASSWD: /usr/bin/systemctl, /usr/bin/nginx, /usr/bin/certbot, /usr/sbin/iptables" | sudo tee /etc/sudoers.d/netpilot-system-ops
```

### 3. Instalar Serviço Systemd

```bash
# Copiar arquivo de serviço
sudo cp systemd/netpilot-system-ops.service /etc/systemd/system/

# Recarregar systemd
sudo systemctl daemon-reload

# Habilitar e iniciar serviço
sudo systemctl enable netpilot-system-ops
sudo systemctl start netpilot-system-ops

# Verificar status
sudo systemctl status netpilot-system-ops
```

## Configuração

### Variáveis de Ambiente

Copie `.env.example` para `.env` e configure:

```bash
# Application Settings
APP_NAME="NetPilot System Operations"
PORT=8001
DEBUG=false

# Integration with NestJS Backend
NESTJS_API_URL="http://localhost:3001"
CALLBACK_TOKEN="netpilot-system-ops-callback-token"

# System Paths
NGINX_SITES_AVAILABLE="/etc/nginx/sites-available"
NGINX_SITES_ENABLED="/etc/nginx/sites-enabled"
SSL_CERTS_PATH="/etc/ssl/netpilot"

# Security Settings
ALLOWED_COMMANDS="nginx,systemctl,certbot,ufw,iptables"
MAX_COMMAND_TIMEOUT=300
```

### Integração com NestJS

O microserviço se integra com o backend NestJS através de:

1. **Callbacks**: Notificações sobre operações completadas
2. **Webhooks**: Endpoints para receber eventos
3. **API Calls**: Chamadas diretas para sincronização

## API Endpoints

### Nginx Operations (`/nginx`)

- `POST /nginx/generate-config` - Gerar configuração Nginx
- `POST /nginx/reload` - Recarregar Nginx
- `GET /nginx/test-config` - Testar configuração
- `POST /nginx/backup-config` - Backup configurações
- `GET /nginx/status` - Status do Nginx

### SSL Operations (`/ssl`)

- `POST /ssl/generate-certificate` - Gerar certificado SSL
- `POST /ssl/renew-certificate` - Renovar certificado
- `GET /ssl/certificate-info/{path}` - Info do certificado
- `POST /ssl/install-certificate` - Instalar certificado
- `GET /ssl/list-certificates` - Listar certificados

### User Management (`/users`)

- `POST /users/create-system-user` - Criar usuário sistema
- `POST /users/create-terminal-session` - Sessão terminal
- `POST /users/execute-command` - Executar comando
- `GET /users/list-sessions` - Listar sessões
- `DELETE /users/close-session/{id}` - Fechar sessão

### Traffic Management (`/traffic`)

- `POST /traffic/setup-rules` - Configurar regras tráfego
- `POST /traffic/block-ip` - Bloquear IP
- `POST /traffic/rate-limit` - Rate limiting
- `GET /traffic/stats` - Estatísticas tráfego
- `GET /traffic/rules` - Listar regras ativas

### System Operations (`/system`)

- `GET /system/health` - Health check
- `GET /system/resources` - Recursos sistema
- `GET /system/services/{name}/status` - Status serviço
- `POST /system/services/restart` - Reiniciar serviço
- `GET /system/logs` - Logs do sistema

## Exemplos de Uso

### Gerar Configuração Nginx

```bash
curl -X POST "http://localhost:8001/nginx/generate-config" \
  -H "Content-Type: application/json" \
  -d '{
    "site": {
      "server_name": "example.com",
      "domains": ["example.com", "www.example.com"],
      "listen_ports": [80, 443],
      "locations": [{
        "path": "/",
        "proxy_pass": "http://localhost:3000"
      }]
    },
    "template": "default",
    "enabled": true
  }'
```

### Gerar Certificado SSL

```bash
curl -X POST "http://localhost:8001/ssl/generate-certificate" \
  -H "Content-Type: application/json" \
  -d '{
    "domains": ["example.com"],
    "provider": "letsencrypt",
    "email": "admin@example.com",
    "challenge_type": "http-01"
  }'
```

### Criar Usuário do Sistema

```bash
curl -X POST "http://localhost:8001/users/create-system-user" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "webapp",
    "user_type": "web",
    "shell": "/bin/bash",
    "groups": ["www-data"],
    "ssh_key": "ssh-rsa AAAAB3NzaC1yc2E..."
  }'
```

### Health Check

```bash
curl "http://localhost:8001/system/health"
```

## Segurança

### Validações Implementadas

1. **Command Validation**: Validação de comandos perigosos
2. **Path Validation**: Verificação de path traversal
3. **Input Sanitization**: Sanitização de entradas
4. **Permission Checks**: Verificação de permissões
5. **Rate Limiting**: Controle de taxa de requisições

### Auditoria

Todas as operações são logadas para auditoria:

```bash
tail -f /var/log/netpilot-audit.log
```

### Comandos Permitidos

Por padrão, apenas comandos seguros são permitidos. Configure `ALLOWED_COMMANDS` para personalizar.

## Desenvolvimento

### Executar em Modo Debug

```bash
export DEBUG=true
export LOG_LEVEL=DEBUG
python main.py
```

### Testes

```bash
# Instalar pytest
pip install pytest httpx

# Executar testes
pytest tests/

# Testes com cobertura
pip install pytest-cov
pytest --cov=. tests/
```

### Estrutura de Logs

```
/var/log/netpilot-system-ops.log    # Logs da aplicação
/var/log/netpilot-audit.log         # Logs de auditoria
```

## Monitoramento

### Health Checks

O serviço expõe vários endpoints para monitoramento:

- `/health` - Health check básico
- `/system/health` - Health check completo do sistema
- `/system/resources` - Recursos do sistema

### Métricas

- CPU, memória e disco
- Status dos serviços
- Estatísticas de rede
- Logs estruturados

## Troubleshooting

### Problemas Comuns

1. **Permission Denied**: Verificar sudoers e permissões
2. **Service Failed**: Verificar logs do systemd
3. **Connection Refused**: Verificar se porta está livre
4. **SSL Issues**: Verificar certificados e chaves

### Logs Úteis

```bash
# Logs do serviço
sudo journalctl -u netpilot-system-ops -f

# Logs da aplicação
tail -f /var/log/netpilot-system-ops.log

# Verificar status
systemctl status netpilot-system-ops
```

### Debug

```bash
# Testar conectividade
curl http://localhost:8001/health

# Verificar configuração
python -c "from main import app; print(app.openapi())"

# Testar callbacks
curl -X POST http://localhost:3001/api/system-ops/callbacks/test
```

## Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Implemente testes
4. Faça commit das mudanças
5. Abra um Pull Request

## Licença

Este projeto é parte do NetPilot e segue a mesma licença.

---

**NetPilot System Operations** - Microserviço FastAPI para operações privilegiadas de sistema.