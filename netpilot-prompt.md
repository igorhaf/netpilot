# Prompt para Claude Code - Sistema NetPilot Completo

Analise as imagens fornecidas que mostram a interface do sistema NetPilot e crie uma aplicação completa de proxy reverso e gerenciamento SSL replicando exatamente todas as funcionalidades, layout, cores e componentes vistos nas telas. A aplicação deve ter:

## Arquitetura Geral
- **Backend**: NestJS com TypeScript
- **Frontend**: Next.js com TypeScript e Tailwind CSS
- **Database**: PostgreSQL
- **Proxy**: Traefik como proxy reverso principal
- **Web Server**: Nginx para servir arquivos estáticos
- **Containerização**: Docker Compose completo
- **Autenticação**: JWT com sistema de usuários

## Funcionalidades Principais

### 1. Dashboard
- Painel principal com métricas do sistema
- Status operacional de serviços (Nginx, Traefik)
- Uptime em porcentagem (99.8%)
- Seção "Logs Recentes" com estado vazio
- Seção "Certificados Expirando" com validação
- Cards com ícones e status coloridos

### 2. Gestão de Domínios
- Lista de domínios com colunas: Domínio, Descrição, Auto TLS, Status, Rotas, Criado em, Ações
- Formulário para adicionar novo domínio com campos:
  - Nome do domínio (ex: exemplo.com)
  - Descrição opcional
  - Checkbox "Ativar Domínio"
  - Checkbox "SSL Automático (Let's Encrypt)"
  - Checkbox "Forçar HTTPS"
  - Checkbox "Bloquear Acesso Externo Direto"
  - Checkbox "Ativar Redirecionamento WWW"
- Modal de confirmação para exclusão com lista de ações que serão executadas
- Busca e filtros por status e Auto TLS

### 3. Proxy Reverso
- Lista de regras de proxy com colunas: Origem, Destino, Domínio, Prioridade, Status, Ações
- Formulário para nova regra com campos:
  - Seleção de domínio (dropdown)
  - Caminho de origem (ex: /old-path, /api/v1/*, /blog/*)
  - URL de destino (ex: https://exemplo.com/new-path)
  - Tipo de redirect (301 - Permanente, 302 - Temporário)
  - Prioridade numérica
  - Checkbox "Manter Query Strings"
  - Checkbox "Ativar regra imediatamente"
- Estado vazio: "Nenhuma regra de proxy encontrada"
- Busca por domínio/target e filtros por status
- Botão "Aplicar Configuração"

### 4. Redirects
- Lista de redirects com colunas: Domínio, Padrão Origem, URL Destino, Tipo
- Formulário similar ao proxy reverso
- Exibição de redirects ativos (exemplo: netpilot.meadadigital.com)
- Busca e filtros por tipo e status

### 5. Certificados SSL
- Dashboard com métricas: Total, Válidos, Expirando, Expirados
- Lista com colunas: Domínio Principal, SAN Domains, Status, Expira em, Auto Renovação, Ações
- Formulário para novo certificado:
  - Seleção de domínio
  - Nome do domínio principal
  - Seção para adicionar domínios SAN
  - Checkbox "Renovação Automática" (30 dias antes da expiração)
- Integração com Let's Encrypt
- Botão "Renovar Expirados"

### 6. Logs
- Seção "Logs de Deployment" com métricas: Total, Sucesso, Falhas, Executando
- Filtros por tipo e status
- Tabela com colunas: Tipo/Ação, Status, Iniciado em, Duração, Ações
- Estado vazio: "Nenhum log encontrado"
- Descrição: "Acompanhe execuções de deploy do Nginx, Traefik e renovações SSL"
- Botão "Atualizar" e "Limpar Logs"

### 7. Sistema de Configuração
- Modal de configuração de domínio com:
  - IP de Bind Interno (127.0.0.1 - Localhost apenas)
  - Configurações básicas (Domínio Ativo, SSL Automático)
  - Configurações de segurança (Forçar HTTPS, Bloquear Acesso Externo)
  - Redirecionamento WWW

## Requisitos Técnicos

### Backend (NestJS)
- Módulos separados para: domains, proxy-rules, redirects, ssl-certificates, logs, auth
- DTOs para validação de dados
- Guards para autenticação JWT
- Interceptors para logging
- Services para lógica de negócio
- Repositories com TypeORM
- Integração com Let's Encrypt via ACME
- Geração automática de configurações Nginx/Traefik
- Sistema de logs estruturado
- API REST completa

### Frontend (Next.js)
- Layout responsivo com sidebar de navegação
- Theme escuro similar às imagens
- Componentes reutilizáveis (Cards, Modals, Forms, Tables)
- Estado global com Context API ou Zustand
- Formulários com validação (react-hook-form + zod)
- Toasts para feedback
- Icons com Lucide React
- Autenticação com JWT e proteção de rotas

### Database (PostgreSQL)
- Tabelas: users, domains, proxy_rules, redirects, ssl_certificates, logs
- Relacionamentos entre entidades
- Índices para performance
- Seeds para dados iniciais

### Docker Compose
- Serviços: app (NestJS), web (Next.js), db (PostgreSQL), traefik, nginx
- Volumes persistentes para dados e configurações
- Network interno para comunicação
- Variáveis de ambiente
- Health checks
- Auto-restart policies

### Configurações Traefik
- Auto-discovery de serviços
- Integração Let's Encrypt
- Middlewares para segurança
- Dashboard opcional

### Configurações Nginx
- Virtual hosts dinâmicos
- Proxy pass configurations
- SSL termination
- Rate limiting
- Security headers

## Estrutura de Arquivos Desejada
```
netpilot/
├── docker-compose.yml
├── .env.example
├── backend/
│   ├── Dockerfile
│   ├── src/
│   │   ├── modules/
│   │   ├── entities/
│   │   ├── dtos/
│   │   └── ...
├── frontend/
│   ├── Dockerfile
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── ...
├── configs/
│   ├── traefik/
│   ├── nginx/
│   └── ssl/
└── scripts/
```

Por favor, gere toda a estrutura funcional com código completo, incluindo:
- Docker Compose com todos os serviços
- Backend NestJS completo com todas as funcionalidades
- Frontend Next.js com todas as telas mostradas
- Configurações Traefik e Nginx
- Database migrations e seeds
- README com instruções de uso

Use as cores e layout exatamente como mostrado nas imagens, com o theme escuro e a paleta verde para elementos ativos.