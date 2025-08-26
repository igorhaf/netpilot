# 📖 NetPilot - Guia do Usuário

## 🚀 **Introdução**

O **NetPilot** é um sistema completo para gerenciar proxy reverso e certificados SSL de forma automatizada. Este guia mostrará como usar todas as funcionalidades do sistema.

---

## 🏠 **Dashboard Principal**

### **Acesso**: `http://localhost/`

O dashboard mostra uma visão geral completa do sistema:

#### **📊 Métricas em Tempo Real**
- **Domínios**: Total, ativos, inativos
- **Regras de Proxy**: Total, ativas, inativas
- **Certificados SSL**: Total, válidos, expirando, expirados
- **Redirects**: Total, ativos, inativos

#### **🔄 Logs Recentes**
- Últimas 5 operações realizadas
- Status: sucesso, falha, em execução
- Tipos: nginx, traefik, ssl_renewal

#### **⚠️ Certificados Expirando**
- Lista de certificados que expiram em breve
- Dias restantes até expiração
- Status atual do certificado

#### **🖥️ Status dos Serviços**
- **Nginx**: Status, uptime, último deploy
- **Traefik**: Status, uptime, último deploy

---

## 🌐 **Gerenciamento de Domínios**

### **Lista de Domínios**: `http://localhost/domains`

#### **Visualização**
- Lista paginada com 15 domínios por página
- Informações: nome, descrição, status, SSL automático
- Contadores: regras de proxy, certificados, redirects
- Data de criação

#### **Ações Disponíveis**
- ✏️ **Editar**: Modificar configurações do domínio
- 🗑️ **Excluir**: Remover domínio (com confirmação)

### **Criar Novo Domínio**: `http://localhost/domains/create`

#### **Campos Obrigatórios**
- **Nome do Domínio**: ex: `exemplo.com`, `api.exemplo.com`
- **Descrição**: Finalidade do domínio

#### **Configurações Opcionais**
- **Registros DNS**: A, CNAME, MX, TXT
- **SSL Automático**: Solicitar certificados automaticamente
- **Status**: Ativo/Inativo

#### **Exemplo de Uso**
```
Nome: app.meusite.com
Descrição: Aplicação principal do site
DNS: A → 192.168.1.100
SSL Automático: ✅ Ativado
Status: ✅ Ativo
```

---

## 🔄 **Proxy Reverso**

### **Lista de Regras**: `http://localhost/proxy`

#### **Visualização**
- Regras ordenadas por prioridade
- Informações: domínio, origem, destino, protocolo
- Status: ativa/inativa
- Configuração Nginx gerada

#### **Ações Disponíveis**
- 🔄 **Toggle**: Ativar/desativar regra
- ✏️ **Editar**: Modificar configurações
- 🗑️ **Excluir**: Remover regra
- 🚀 **Deploy**: Aplicar configurações no Nginx

### **Criar Regra de Proxy**: `http://localhost/proxy/create`

#### **Configuração de Origem**
- **Domínio**: Selecionar da lista de domínios ativos
- **Host de Origem**: ex: `app.exemplo.com`
- **Porta de Origem**: 80, 443, 8080, 3000, 9000

#### **Configuração de Destino**
- **Host de Destino**: ex: `localhost`, `192.168.1.10`
- **Porta de Destino**: Porta do serviço
- **Protocolo**: HTTP ou HTTPS

#### **Configurações Avançadas**
- **Prioridade**: 1-1000 (menor = maior prioridade)
- **Headers Customizados**: Headers HTTP adicionais
- **Status**: Ativar regra imediatamente

#### **Exemplo de Uso**
```
Domínio: app.exemplo.com
Origem: app.exemplo.com:80
Destino: localhost:3000
Protocolo: HTTP
Prioridade: 100
Headers: X-Forwarded-Proto → $scheme
Status: ✅ Ativa
```

#### **Preview da Regra**
O sistema mostra uma prévia da configuração antes de salvar:
```
Origem: http://app.exemplo.com:80
Destino: http://localhost:3000
Prioridade: 100
Status: Ativa
```

---

## 🔐 **Certificados SSL**

### **Lista de Certificados**: `http://localhost/ssl`

#### **Visualização**
- Certificados ordenados por data de expiração
- Informações: domínio, status, emissão, expiração
- Domínios SAN incluídos
- Renovação automática configurada

#### **Status dos Certificados**
- 🟢 **Válido**: Certificado ativo e funcionando
- 🟡 **Expirando**: Próximo da data de expiração
- 🔴 **Expirado**: Certificado vencido
- ⏳ **Pendente**: Em processo de emissão
- ❌ **Falhou**: Erro na emissão/renovação

#### **Ações Disponíveis**
- 🔄 **Renovar**: Renovação manual
- 🗑️ **Revogar**: Revogar certificado
- 📋 **Detalhes**: Ver informações completas

### **Solicitar Certificado**: `http://localhost/ssl/create`

#### **Configuração Básica**
- **Domínio**: Selecionar da lista
- **Nome do Domínio Principal**: ex: `exemplo.com`

#### **Domínios SAN (Subject Alternative Names)**
- Adicionar domínios extras no mesmo certificado
- ex: `www.exemplo.com`, `api.exemplo.com`

#### **Renovação Automática**
- **Ativada**: Renovar automaticamente antes da expiração
- **Dias Antes**: Quantos dias antes renovar (padrão: 30)

#### **Exemplo de Uso**
```
Domínio: exemplo.com
Domínio Principal: exemplo.com
Domínios SAN: 
  - www.exemplo.com
  - api.exemplo.com
Renovação Automática: ✅ Ativada
Renovar: 30 dias antes da expiração
```

---

## 📝 **Logs e Monitoramento**

### **Visualizar Logs**: `http://localhost/logs`

#### **Tipos de Logs**
- **nginx**: Deploy de configurações
- **traefik**: Deploy de SSL
- **ssl_renewal**: Renovação de certificados

#### **Status dos Logs**
- ⏳ **Pendente**: Operação agendada
- 🔄 **Executando**: Em andamento
- ✅ **Sucesso**: Concluída com êxito
- ❌ **Falhou**: Erro na execução

#### **Filtros Disponíveis**
- Por tipo de operação
- Por status
- Por período de data

---

## ⚡ **Comandos Artisan**

### **Renovação de Certificados SSL**

```bash
# Renovar certificados expirando
php artisan ssl:renew

# Renovar todos os certificados (forçado)
php artisan ssl:renew --force

# Simular renovação (sem executar)
php artisan ssl:renew --dry-run
```

### **Deploy do Nginx**

```bash
# Deploy das configurações
php artisan nginx:deploy

# Deploy forçado
php artisan nginx:deploy --force

# Simular deploy
php artisan nginx:deploy --dry-run
```

### **Limpeza de Logs**

```bash
# Limpar logs antigos (30 dias)
php artisan logs:cleanup

# Limpar logs específicos
php artisan logs:cleanup --days=60

# Limpeza forçada (sem confirmação)
php artisan logs:cleanup --force
```

---

## 🔧 **Configurações Automáticas**

### **Agendamento (Cron)**

O sistema executa automaticamente:

- **02:00 AM** - Renovação de certificados SSL
- **A cada 5 min** - Deploy do Nginx (se houver mudanças)
- **Semanal** - Limpeza de logs antigos

### **Configuração do Crontab**

```bash
* * * * * cd /path-to-netpilot && php artisan schedule:run >> /dev/null 2>&1
```

---

## 🚨 **Solução de Problemas**

### **Certificado SSL Falhou**

#### **Possíveis Causas**
- Domínio não acessível externamente
- DNS não configurado corretamente
- Firewall bloqueando porta 80/443

#### **Soluções**
1. Verificar DNS: `nslookup exemplo.com`
2. Testar conectividade: `curl http://exemplo.com`
3. Verificar logs: `/logs` no sistema

### **Proxy Não Funcionando**

#### **Possíveis Causas**
- Serviço de destino offline
- Configuração incorreta de porta
- Nginx não recarregado

#### **Soluções**
1. Verificar serviço: `curl http://localhost:3000`
2. Testar configuração: `nginx -t`
3. Recarregar Nginx: Deploy manual

### **Dashboard Não Carrega**

#### **Possíveis Causas**
- Vite não está rodando
- Erro no banco de dados
- Cache corrompido

#### **Soluções**
1. Iniciar Vite: `npm run dev`
2. Verificar banco: `php artisan migrate:status`
3. Limpar cache: `php artisan cache:clear`

---

## 📋 **Checklist de Configuração**

### **Novo Domínio**
- [ ] Criar domínio no sistema
- [ ] Configurar DNS (A/CNAME)
- [ ] Criar regra de proxy
- [ ] Solicitar certificado SSL (se necessário)
- [ ] Testar acesso

### **Nova Aplicação**
- [ ] Verificar se aplicação está rodando
- [ ] Criar/selecionar domínio
- [ ] Configurar proxy reverso
- [ ] Definir prioridade correta
- [ ] Fazer deploy das configurações
- [ ] Testar redirecionamento

### **Renovação SSL**
- [ ] Verificar certificados expirando
- [ ] Configurar renovação automática
- [ ] Testar processo de renovação
- [ ] Verificar logs de renovação

---

## 🎯 **Boas Práticas**

### **Domínios**
- Use nomes descritivos
- Configure DNS antes de criar
- Ative SSL automático quando possível

### **Proxy Reverso**
- Defina prioridades lógicas
- Use headers apropriados
- Teste sempre após mudanças

### **Certificados SSL**
- Ative renovação automática
- Configure 30 dias antes da expiração
- Monitore logs de renovação

### **Monitoramento**
- Verifique dashboard diariamente
- Configure alertas de expiração
- Mantenha logs limpos

---

## 📞 **Suporte**

### **Logs do Sistema**
```bash
# Laravel
tail -f storage/logs/laravel.log

# Nginx
tail -f /var/log/nginx/error.log

# Traefik
tail -f /var/log/traefik/traefik.log
```

### **Comandos Úteis**
```bash
# Status dos serviços
systemctl status nginx
systemctl status traefik

# Testar configurações
nginx -t
traefik version

# Verificar certificados
certbot certificates
```

---

**✨ NetPilot - Seu sistema completo de proxy reverso e SSL**

*Para mais informações, consulte o [Blueprint Técnico](BLUEPRINT.md)*
