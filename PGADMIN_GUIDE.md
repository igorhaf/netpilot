# pgAdmin no NetPilot

## 🐘 Interface Web para PostgreSQL

O pgAdmin foi instalado e configurado no ambiente Docker NetPilot para fornecer uma interface gráfica profissional para gerenciamento do PostgreSQL.

## 🚀 Acesso Rápido

### URL
```
http://localhost:8091
```

### Credenciais
- **Email:** `admin@meadadigital.com`
- **Senha:** `netpilot123`

### Configuração do Servidor PostgreSQL
Após o login, configure a conexão com o PostgreSQL:

- **Host:** `db` (nome do container PostgreSQL)
- **Port:** `5432`
- **Database:** `netpilot`
- **Username:** `netpilot`
- **Password:** `netpilot123`

## 📊 Configuração Técnica

### Container Details
- **Imagem:** `dpage/pgadmin4:latest`
- **Container:** `netpilot-pgadmin`
- **Porta Externa:** `8091`
- **Porta Interna:** `80`
- **Network:** `netpilot-network`
- **Volume:** `pgadmin_data`

### Variáveis de Ambiente
```yaml
PGADMIN_DEFAULT_EMAIL: admin@meadadigital.com
PGADMIN_DEFAULT_PASSWORD: netpilot123
PGADMIN_CONFIG_SERVER_MODE: 'False'          # Modo desktop
PGADMIN_CONFIG_MASTER_PASSWORD_REQUIRED: 'False'
```

## 🛠️ Funcionalidades Disponíveis

### ✅ Administração de Banco
- Gerenciar databases, schemas, tabelas
- Criar/alterar/deletar objetos
- Controle de usuários e permissões
- Configurar conexões múltiplas

### ✅ Query Tool
- Editor SQL avançado com syntax highlighting
- Histórico de queries
- Plano de execução (EXPLAIN)
- Resultados em grid/texto

### ✅ Monitoramento
- Dashboard de estatísticas
- Monitoramento de sessões ativas
- Análise de performance
- Logs do servidor

### ✅ Backup & Restore
- Backup via pg_dump
- Restore de backups
- Import/Export dados
- Backup agendado

### ✅ Desenvolvimento
- Debugger para funções
- Editor de stored procedures
- Gerenciador de triggers
- Designer visual de tabelas

## 📋 Configuração Inicial do Servidor

### Primeira Conexão
1. Acesse `http://localhost:8091`
2. Login com `admin@meadadigital.com` / `netpilot123`
3. Clique em "Add New Server"
4. **General Tab:**
   - Name: `NetPilot PostgreSQL`
5. **Connection Tab:**
   - Host: `db`
   - Port: `5432`
   - Database: `netpilot`
   - Username: `netpilot`
   - Password: `netpilot123`
   - Save password: ✅
6. Click "Save"

### Configuração Salva
Após configurar uma vez, a conexão ficará salva e disponível para uso futuro.

## 🔧 Comandos Úteis

### Restart pgAdmin
```bash
docker-compose restart pgadmin
```

### Ver Logs
```bash
docker-compose logs -f pgadmin
```

### Status
```bash
docker-compose ps pgadmin
```

### Backup Volume
```bash
docker run --rm -v netpilot_pgadmin_data:/data -v $(pwd):/backup alpine tar czf /backup/pgadmin_backup.tar.gz /data
```

## 🌐 Integrações

### Com PostgreSQL NetPilot
- **Conexão Automática:** Via hostname `db`
- **Database:** `netpilot` 
- **Network:** Comunicação interna `netpilot-network`
- **Persistência:** Configurações salvas em volume

### Com Aplicação
- **Desenvolvimento:** Debug de queries e estruturas
- **Monitoramento:** Análise de performance
- **Backup:** Estratégias de backup automático
- **Migração:** Versionamento de schema

## 🚨 Segurança

### Configuração Atual
- **Modo:** Desktop (não requer autenticação extra)
- **Acesso:** Localhost apenas
- **Volume:** Dados persistentes em `pgadmin_data`

### Recomendações
- **Produção:** Configure autenticação adicional
- **Firewall:** Porta 8091 só acessível localmente
- **Updates:** Mantenha pgAdmin atualizado
- **Backup:** Backup regular das configurações

## 📊 Recursos Avançados

### Dashboard
- Estatísticas em tempo real
- Gráficos de performance
- Monitoramento de conexões
- Alertas customizados

### Query Tool Avançado
- Múltiplas abas
- Autocomplete SQL
- Formatação de código
- Export resultados

### Backup Automático
- Configurar jobs de backup
- Backup incremental
- Restore point-in-time
- Armazenamento em nuvem

## 🔗 URLs de Referência

- **pgAdmin:** http://localhost:8091
- **PostgreSQL Direct:** localhost:5432
- **phpMyAdmin (MySQL):** http://localhost:8090
- **NetPilot App:** https://netpilot.meadadigital.com

## 💡 Dicas de Uso

### Performance
- Use EXPLAIN ANALYZE para analisar queries
- Configure índices adequados
- Monitore conexões ativas

### Desenvolvimento
- Use o Query Tool para desenvolvimento
- Aproveite o syntax highlighting
- Configure snippets personalizados

### Backup
- Configure backup automático
- Teste restores regularmente
- Documente estratégias de recovery

---

**Nota:** O pgAdmin está configurado e pronto para uso. A primeira vez requer configuração manual da conexão com o PostgreSQL, mas depois fica salva automaticamente.
