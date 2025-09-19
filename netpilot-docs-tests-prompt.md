# Prompt para Documentação e Testes NetPilot

Com base no projeto NetPilot já criado, gere agora uma documentação completa e testes abrangentes:

## 1. DOCUMENTAÇÃO COMPLETA (pasta /docs)

### Documentação de Contexto:
- README.md principal com overview, arquitetura e guia de instalação
- ARCHITECTURE.md detalhando a estrutura do sistema, fluxo de dados e decisões técnicas
- DEPLOYMENT.md com instruções completas de deploy e configuração
- API.md com documentação de todas as rotas, parâmetros e respostas
- DEVELOPMENT.md com guia para desenvolvedores, padrões de código e workflow
- TROUBLESHOOTING.md com problemas comuns e soluções
- SECURITY.md sobre práticas de segurança implementadas

### Documentação Técnica:
- DATABASE.md com schema, relacionamentos e migrations
- DOCKER.md explicando os containers e configurações
- NGINX.md sobre configurações de proxy reverso
- TRAEFIK.md sobre configurações de load balancer
- SSL.md sobre gerenciamento de certificados

## 2. APIs RESTful COMPLETAS (formato JSON OpenAPI 3.0)

Gere arquivos swagger.json/openapi.json completos para todos os módulos:

### /docs/api/auth.json - Autenticação
- POST /auth/login
- POST /auth/register  
- POST /auth/refresh
- POST /auth/logout
- GET /auth/me

### /docs/api/domains.json - Domínios
- GET /domains (listar com filtros)
- POST /domains (criar)
- GET /domains/:id (obter)
- PUT /domains/:id (atualizar)
- DELETE /domains/:id (excluir)
- PATCH /domains/:id/toggle (ativar/desativar)

### /docs/api/proxy-rules.json - Regras de Proxy
- GET /proxy-rules
- POST /proxy-rules
- GET /proxy-rules/:id
- PUT /proxy-rules/:id
- DELETE /proxy-rules/:id
- POST /proxy-rules/apply (aplicar configurações)

### /docs/api/redirects.json - Redirects
- GET /redirects
- POST /redirects
- GET /redirects/:id
- PUT /redirects/:id
- DELETE /redirects/:id

### /docs/api/ssl-certificates.json - Certificados SSL
- GET /ssl-certificates
- POST /ssl-certificates (solicitar novo)
- GET /ssl-certificates/:id
- DELETE /ssl-certificates/:id
- POST /ssl-certificates/renew (renovar expirados)
- GET /ssl-certificates/check-expiration

### /docs/api/logs.json - Logs
- GET /logs/deployment
- GET /logs/system
- DELETE /logs/clear
- GET /logs/stats

### /docs/api/system.json - Sistema
- GET /system/status
- GET /system/health
- GET /system/metrics

## 3. TESTES COMPLETOS

### Testes Unitários (Jest)
Para cada módulo do backend NestJS:
- Services (lógica de negócio)
- Controllers (endpoints)
- Entities (modelos)
- DTOs (validações)
- Guards (autenticação)
- Interceptors

### Testes de Integração
- Testes de API endpoints completos
- Testes de database com dados mock
- Testes de autenticação JWT
- Testes de integração com Let's Encrypt
- Testes de geração de configurações Nginx/Traefik

### Testes End-to-End (E2E)
- Cypress ou Playwright para frontend
- Fluxos completos: login → criar domínio → configurar proxy → gerar SSL
- Testes de interface para todas as telas mostradas
- Testes de responsividade

### Testes de Carga
- Artillery.js ou k6 para testes de performance
- Cenários de alta concorrência
- Testes de stress nas APIs

## 4. ESTRUTURA DESEJADA

```
netpilot/
├── docs/
│   ├── README.md
│   ├── ARCHITECTURE.md
│   ├── API.md
│   ├── DEPLOYMENT.md
│   ├── DEVELOPMENT.md
│   ├── TROUBLESHOOTING.md
│   ├── SECURITY.md
│   ├── DATABASE.md
│   ├── DOCKER.md
│   ├── NGINX.md
│   ├── TRAEFIK.md
│   ├── SSL.md
│   └── api/
│       ├── auth.json
│       ├── domains.json
│       ├── proxy-rules.json
│       ├── redirects.json
│       ├── ssl-certificates.json
│       ├── logs.json
│       └── system.json
├── backend/
│   └── test/
│       ├── unit/
│       ├── integration/
│       └── e2e/
├── frontend/
│   └── cypress/
│       ├── integration/
│       └── support/
└── tests/
    ├── load/
    └── performance/
```

## REQUISITOS ESPECÍFICOS:

1. **Documentação deve ser técnica e detalhada** - inclua diagramas ASCII quando necessário
2. **APIs RESTful devem seguir padrões OpenAPI 3.0** - com exemplos de request/response
3. **Testes devem ter cobertura > 90%** - incluindo casos de erro e edge cases
4. **Testes E2E devem cobrir todos os fluxos das telas** mostradas nas imagens originais
5. **Performance tests para cenários reais** - múltiplos domínios, muitas regras de proxy
6. **Documentação deve incluir diagramas de arquitetura** em formato ASCII ou Mermaid
7. **APIs devem incluir validação completa** com exemplos de erros 400, 401, 403, 404, 500
8. **Testes devem incluir mocks para serviços externos** (Let's Encrypt, DNS, etc.)
9. **Documentação de deployment deve cobrir** desenvolvimento, staging e produção
10. **Inclua guias de troubleshooting detalhados** com cenários comuns

## CONTEXTO ADICIONAL:

- O sistema gerencia proxy reverso usando Traefik e Nginx
- Integração com Let's Encrypt para SSL automático
- Interface web dark theme com componentes em React/Next.js
- Backend em NestJS com PostgreSQL
- Autenticação JWT com refresh tokens
- Sistema de logs estruturado para auditoria
- Configurações dinâmicas de proxy sem restart
- Suporte a multiple domains e subdominios
- Dashboard com métricas em tempo real

Gere tudo de forma funcional, bem estruturada e pronta para uso em produção.