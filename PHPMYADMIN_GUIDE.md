# phpMyAdmin no NetPilot

## 🌐 Interface Web para MySQL

O phpMyAdmin foi instalado e configurado automaticamente no ambiente Docker NetPilot para fornecer uma interface gráfica completa para gerenciamento do MySQL.

## 🚀 Acesso Rápido

### URL
```
http://localhost:8090
```

### Credenciais (Auto-login)
- **Usuário:** `netpilot`
- **Senha:** `netpilot123`
- **Servidor:** `mysql` (conecta automaticamente)
- **Database:** `netpilot`

## 📊 Configuração Técnica

### Container Details
- **Imagem:** `phpmyadmin/phpmyadmin:latest`
- **Container:** `netpilot-phpmyadmin`
- **Porta Externa:** `8090`
- **Porta Interna:** `80`
- **Network:** `netpilot-network`

### Variáveis de Ambiente
```yaml
PMA_HOST: mysql          # Conecta ao container MySQL
PMA_PORT: 3306          # Porta do MySQL
PMA_USER: netpilot      # Login automático
PMA_PASSWORD: netpilot123
UPLOAD_LIMIT: 128M      # Limite de upload
```

## 🛠️ Funcionalidades Disponíveis

### ✅ Navegação de Dados
- Visualizar tabelas e estruturas
- Navegar pelos dados
- Pesquisar e filtrar registros
- Ordenação e paginação

### ✅ Editor SQL
- Executar queries personalizadas
- Histórico de comandos
- Syntax highlighting
- Exportar resultados

### ✅ Import/Export
- Import arquivos SQL
- Export em vários formatos (SQL, CSV, Excel, etc.)
- Backup completo do banco
- Restore de backups

### ✅ Administração
- Criar/alterar/deletar tabelas
- Gerenciar índices
- Controle de usuários
- Estatísticas do banco
- Monitoramento de performance

### ✅ Desenvolvimento
- Designer de relacionamentos
- Gerador de código
- Trigger e stored procedures
- Views e functions

## 🔧 Comandos Úteis

### Restart phpMyAdmin
```bash
docker-compose restart phpmyadmin
```

### Ver Logs
```bash
docker-compose logs -f phpmyadmin
```

### Status
```bash
docker-compose ps phpmyadmin
```

## 🌐 Integrações

### Com MySQL NetPilot
- **Conexão Automática:** Já configurada
- **Database:** `netpilot` selecionado por padrão
- **Usuário:** `netpilot` com permissões completas
- **Network:** Comunicação interna via `netpilot-network`

### Com Aplicação
- **Desenvolvimento:** Ideal para debug e testes
- **Migração:** Import/export fácil de dados
- **Backup:** Interface visual para backups
- **Monitoramento:** Análise de performance

## 🚨 Segurança

### Recomendações
- **Produção:** Considere remover ou proteger com proxy reverso
- **Firewall:** Porta 8090 só deve ser acessível localmente
- **Backup:** Use sempre antes de operações críticas
- **Updates:** Mantenha a imagem atualizada

### Configuração Atual
- **Ambiente:** Desenvolvimento/Local
- **Acesso:** Localhost apenas
- **Login:** Credenciais padrão do projeto

## 🔗 Links Úteis

- **phpMyAdmin:** http://localhost:8090
- **MySQL Direct:** localhost:3307
- **NetPilot App:** https://netpilot.meadadigital.com
- **Traefik Dashboard:** http://localhost:8080

## ⚡ Dicas de Uso

### Performance
- Use LIMIT nas queries grandes
- Crie índices adequados
- Monitore o uso de memória

### Backup
- Export regular das estruturas
- Backup dos dados críticos
- Teste os restores periodicamente

### Desenvolvimento
- Use o SQL Editor para testes
- Aproveite o Designer para relacionamentos
- Configure triggers diretamente na interface

---

**Nota:** O phpMyAdmin está configurado automaticamente e pronto para uso. Não requer configuração adicional para conectar ao MySQL do NetPilot.
