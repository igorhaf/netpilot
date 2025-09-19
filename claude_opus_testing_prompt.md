# Prompt para Claude Opus - Testes Completos Sistema NetPilot

Você deve executar uma bateria completa de testes para o sistema NetPilot (proxy reverso e gerenciamento SSL), garantindo que TODOS os testes passem e todas as funcionalidades estejam operacionais.

## Objetivo Principal

Execute todos os tipos de testes existentes no projeto NetPilot e garanta que TODOS passem. Se algum teste falhar, você deve investigar, corrigir o problema e tentar novamente até que tudo funcione perfeitamente.

## Configuração Inicial do Ambiente

1. **Subir o ambiente Docker**: Execute o docker-compose e verifique se todos os serviços estão rodando
2. **Verificar serviços**: Confirme que estão ativos: NestJS backend, Next.js frontend, PostgreSQL, Traefik, Nginx
3. **Executar migrations**: Configure o banco de dados com todas as tabelas
4. **Executar seeds**: Popule com dados realistas de teste
5. **Verificar conectividade**: Teste se todos os containers estão se comunicando

## Credenciais Obrigatórias

Para todos os testes que envolvem login ou autenticação:
- **Email/Login**: admin.netpilot.local  
- **Senha**: admin123

## Testes Funcionais A-Z (Principais)

### 1. Teste de Dashboard
- Acesse o dashboard principal
- Verifique se métricas do sistema carregam
- Confirme status dos serviços (Nginx, Traefik)
- Valide uptime percentual
- Teste seção "Logs Recentes"
- Teste seção "Certificados Expirando"
- Verifique se cards e ícones aparecem corretamente

### 2. Testes de Gestão de Domínios
- **Listar domínios**: Verifique se lista carrega com todas as colunas
- **Adicionar domínio**: 
  - Preencha formulário completo (nome, descrição, checkboxes)
  - Teste "Ativar Domínio"
  - Teste "SSL Automático (Let's Encrypt)"
  - Teste "Forçar HTTPS"
  - Teste "Bloquear Acesso Externo Direto"
  - Teste "Ativar Redirecionamento WWW"
  - Confirme que domínio foi criado
- **Editar domínio**: Modifique configurações e salve
- **Excluir domínio**: Teste modal de confirmação e exclusão
- **Buscar domínios**: Teste filtros por status e Auto TLS
- **Validações**: Teste campos obrigatórios e formatos

### 3. Testes de Proxy Reverso
- **Listar regras**: Verifique colunas (Origem, Destino, Domínio, Prioridade, Status)
- **Criar regra**: 
  - Selecione domínio no dropdown
  - Configure caminho origem (/old-path, /api/v1/*, /blog/*)
  - Configure URL destino
  - Teste tipos de redirect (301, 302)
  - Configure prioridade numérica
  - Teste "Manter Query Strings"
  - Teste "Ativar regra imediatamente"
- **Aplicar configuração**: Teste botão "Aplicar Configuração"
- **Buscar regras**: Teste busca por domínio/target
- **Validações**: Teste URLs válidas e prioridades

### 4. Testes de Redirects
- **Listar redirects**: Verifique colunas (Domínio, Padrão Origem, URL Destino, Tipo)
- **Criar redirect**: Similar ao proxy reverso
- **Testar redirects ativos**: Verifique se funcionam na prática
- **Buscar redirects**: Teste filtros por tipo e status
- **Validações**: Teste padrões de origem válidos

### 5. Testes de Certificados SSL
- **Dashboard SSL**: Verifique métricas (Total, Válidos, Expirando, Expirados)
- **Listar certificados**: Teste colunas (Domínio Principal, SAN Domains, Status, Expira em)
- **Criar certificado**:
  - Selecione domínio
  - Configure domínio principal
  - Adicione domínios SAN
  - Teste "Renovação Automática"
  - Verifique integração Let's Encrypt
- **Renovar certificados**: Teste botão "Renovar Expirados"
- **Validações**: Teste domínios válidos e configurações

### 6. Testes de Logs
- **Dashboard logs**: Verifique métricas (Total, Sucesso, Falhas, Executando)
- **Listar logs**: Teste colunas (Tipo/Ação, Status, Iniciado em, Duração)
- **Filtrar logs**: Teste filtros por tipo e status
- **Atualizar logs**: Teste botão "Atualizar"
- **Limpar logs**: Teste botão "Limpar Logs"
- **Validar descrições**: "Acompanhe execuções de deploy do Nginx, Traefik e renovações SSL"

### 7. Testes de Configuração
- **Modal configuração domínio**:
  - Teste IP de Bind Interno (127.0.0.1)
  - Teste configurações básicas (Domínio Ativo, SSL Automático)
  - Teste configurações de segurança (Forçar HTTPS, Bloquear Acesso Externo)
  - Teste Redirecionamento WWW

### 8. Testes de Autenticação
- **Login**: Use credenciais fornecidas e confirme acesso
- **Logout**: Teste saída do sistema
- **Proteção de rotas**: Verifique se páginas exigem autenticação
- **JWT**: Confirme tokens funcionando

## Tipos de Testes para Executar

### Testes Unitários
Execute todos os testes unitários que verificam:
- Services do backend
- Components do frontend
- Utilities e helpers
- Validações de DTOs

### Testes de Integração (E2E Backend)
Teste todas as APIs:
- Endpoints de domínios
- Endpoints de proxy
- Endpoints de redirects
- Endpoints de SSL
- Endpoints de logs
- Autenticação JWT

### Testes Frontend (Playwright)
Teste toda interface:
- Navegação entre páginas
- Formulários e validações
- Modals e componentes
- Fluxos completos de usuário
- Responsividade
- Theme escuro

## Verificações de Infraestrutura

### Docker e Serviços
- Confirme que todos containers estão UP
- Teste conectividade entre serviços
- Verifique logs dos containers
- Confirme volumes persistentes

### Traefik
- Verifique dashboard Traefik
- Teste roteamento automático
- Confirme integração Let's Encrypt

### Nginx
- Verifique configurações geradas
- Teste virtual hosts
- Confirme proxy pass

### PostgreSQL
- Teste conexão com banco
- Verifique estrutura das tabelas
- Confirme dados de seed

## Dados Realistas Obrigatórios

Use dados que pareçam reais em todos os testes:
- Domínios: exemplo.com, site.com.br, blog.exemplo.org
- Emails: admin@exemplo.com, user@site.com.br
- Caminhos: /api/v1/users, /blog/*, /admin/dashboard
- URLs: https://api.exemplo.com, https://cdn.site.com
- IPs: 192.168.1.100, 10.0.0.50

## Critério de Sucesso Final

O trabalho só está completo quando:
- ✅ TODOS os testes unitários passam (100%)
- ✅ TODOS os testes E2E passam (100%)  
- ✅ TODOS os testes Playwright passam (100%)
- ✅ Todos os containers Docker estão operacionais
- ✅ Login funciona com credenciais especificadas
- ✅ Todas as funcionalidades do NetPilot estão operacionais
- ✅ Domínios podem ser criados, editados e excluídos
- ✅ Regras de proxy funcionam corretamente
- ✅ Redirects são aplicados
- ✅ Certificados SSL são gerados
- ✅ Logs são registrados corretamente
- ✅ Interface responde sem erros

## Estratégia de Correção

Quando encontrar falhas:
1. Analise o erro específico no contexto NetPilot
2. Identifique se é backend (NestJS), frontend (Next.js) ou infraestrutura
3. Corrija o código/configuração necessária
4. Execute novamente o teste específico
5. Execute toda suíte para garantir que não quebrou outras funcionalidades
6. Documente correções importantes
7. Repita até TODOS os testes passarem

Sua missão é garantir que o sistema NetPilot esteja impecável e totalmente funcional!