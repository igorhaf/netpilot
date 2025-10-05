# Claude Code - Sistema de Agentes Dual

Sistema de execução de comandos Claude Code com dois agentes (bender e marvin) compartilhando contexto.

## 🏗️ Arquitetura

```
Frontend (Next.js)
    ↓
Backend NestJS (Docker)
    ↓ HTTP Request
FastAPI System Ops (HOST - porta 8001)
    ↓ Executa no HOST
Claude CLI (bender ou marvin)
    ↓
/home/{projeto}/code/
```

## 👥 Agentes

### Bender (Master)
- **Papel**: Agente mestre
- **Dados**: Armazena histórico original
- **Localização**: `/home/bender/.claude/`
- **Credenciais**: Próprias em `.credentials.json`

### Marvin (Slave)
- **Papel**: Agente slave
- **Dados**: Usa symlinks para dados do bender
- **Localização**: `/home/marvin/.claude/`
- **Credenciais**: Próprias em `.credentials.json`

## 🔗 Compartilhamento via Symlinks

```bash
/home/marvin/.claude/history.jsonl → /home/bender/.claude/history.jsonl
/home/marvin/.claude/projects/ → /home/bender/.claude/projects/
/home/marvin/.claude/file-history/ → /home/bender/.claude/file-history/
```

**NÃO compartilhado**: `.credentials.json` (cada agente tem suas próprias credenciais)

## 📁 Estrutura de Projetos

Cada projeto criado tem a seguinte estrutura:

```
/home/{projeto_alias}/
├── code/              # Diretório de trabalho do Claude
│   └── repo/         # Repositório clonado (se houver)
├── contexts/         # Arquivos de contexto
└── .claude/          # (criado automaticamente pelo Claude)
```

### Permissões

- `/home/{projeto}` → `drwxr-x--x` (o+x - outros podem atravessar)
- `/home/{projeto}/code` → `drwxr-xr-x` (o+rx - outros podem ler/executar)
- `/home/{projeto}/contexts` → `drwxr-xr-x` (o+rx - outros podem ler/executar)

Isso permite que bender/marvin acessem qualquer projeto.

## 🔄 Fluxo de Execução

### 1. Usuário envia prompt no chat

### 2. Backend seleciona agente aleatoriamente
```typescript
const agents = ['bender', 'marvin'];
const selectedAgent = agents[Math.floor(Math.random() * agents.length)];
```

### 3. Backend chama FastAPI
```bash
POST http://172.18.0.1:8001/claude/execute
{
  "projectPath": "/home/deit/code",
  "prompt": "crie um arquivo README.md",
  "agent": "marvin",
  "timeoutSeconds": 300
}
```

### 4. FastAPI executa no HOST
```bash
su -s /bin/bash marvin -c 'cd "/home/deit/code" && claude --continue "crie um arquivo README.md"'
```

### 5. Saída retorna para o chat
- stdout → conteúdo da resposta
- stderr → avisos (se houver)
- Salvo no banco de dados
- Exibido no chat para o usuário

## 🚀 Load Balancing

- **Estratégia**: Random 50/50
- **Seleção**: Aleatória em cada execução
- **Compartilhamento**: Contexto compartilhado via symlinks
- **Isolamento**: Credenciais separadas

## 📊 Endpoints da API

### FastAPI System Ops (porta 8001)

#### POST /claude/execute
Executa comando Claude Code

**Request:**
```json
{
  "projectPath": "/home/projeto/code",
  "prompt": "seu prompt aqui",
  "agent": "bender|marvin|null",  // null = aleatório
  "timeoutSeconds": 300
}
```

**Response:**
```json
{
  "success": true,
  "stdout": "saída do comando",
  "stderr": "avisos (se houver)",
  "agent": "bender",
  "returncode": 0,
  "executionTimeMs": 1234
}
```

#### GET /claude/agents
Lista agentes disponíveis

#### GET /claude/health
Verifica status dos agentes

## 🔧 Setup Manual

### 1. Criar Usuários
```bash
# Criar usuário bender
sudo useradd -m -s /bin/bash bender

# Criar usuário marvin
sudo useradd -m -s /bin/bash marvin
```

### 2. Instalar Claude CLI
```bash
# Para ambos os usuários
sudo -u bender npm install -g @anthropic-ai/claude-code
sudo -u marvin npm install -g @anthropic-ai/claude-code
```

### 3. Fazer Login
```bash
# Login bender
sudo -u bender claude login

# Login marvin
sudo -u marvin claude login
```

### 4. Criar Symlinks
```bash
# Executar script de setup
/home/projects/netpilot/backend/scripts/setup-claude-agents.sh
```

Ou manualmente:
```bash
# Criar estrutura no master
sudo -u bender mkdir -p /home/bender/.claude/{projects,file-history}
sudo -u bender touch /home/bender/.claude/history.jsonl

# Criar .claude no slave
sudo -u marvin mkdir -p /home/marvin/.claude

# Remover arquivos existentes no slave
sudo rm -rf /home/marvin/.claude/{history.jsonl,projects,file-history}

# Criar symlinks
sudo -u marvin ln -s /home/bender/.claude/history.jsonl /home/marvin/.claude/history.jsonl
sudo -u marvin ln -s /home/bender/.claude/projects /home/marvin/.claude/projects
sudo -u marvin ln -s /home/bender/.claude/file-history /home/marvin/.claude/file-history

# Ajustar permissões
sudo chown -R bender:bender /home/bender/.claude
sudo chmod -R 755 /home/bender/.claude
```

## 🧪 Testes

### Teste Manual via CLI
```bash
# Test bender
su -s /bin/bash bender -c 'cd /home/deit/code && claude --continue "liste os arquivos"'

# Test marvin
su -s /bin/bash marvin -c 'cd /home/deit/code && claude --continue "liste os arquivos"'
```

### Teste via API
```bash
curl -X POST http://172.18.0.1:8001/claude/execute \
  -H "Content-Type: application/json" \
  -d '{
    "projectPath": "/home/deit/code",
    "prompt": "crie um arquivo teste.txt com conteudo Hello World",
    "agent": "bender",
    "timeoutSeconds": 60
  }'
```

### Verificar Agentes
```bash
curl http://172.18.0.1:8001/claude/agents
curl http://172.18.0.1:8001/claude/health
```

## 🐛 Troubleshooting

### Problema: Permission denied ao acessar projeto

**Solução**: Verificar permissões
```bash
chmod o+x /home/{projeto}
chmod o+rx /home/{projeto}/code
chmod o+rx /home/{projeto}/contexts
```

### Problema: Claude não autenticado

**Solução**: Fazer login novamente
```bash
sudo -u bender claude login
sudo -u marvin claude login
```

### Problema: Symlinks quebrados

**Solução**: Recriar symlinks
```bash
/home/projects/netpilot/backend/scripts/setup-claude-agents.sh
```

### Problema: FastAPI não responde

**Solução**: Reiniciar serviço
```bash
ps aux | grep "python.*main.py" | awk '{print $2}' | xargs kill -9
cd /home/projects/netpilot/system-ops
source venv/bin/activate
DATABASE_URL=postgresql://netpilot:netpilot123@localhost:5432/netpilot PORT=8001 python3 main.py &
```

## 📝 Logs

### Backend NestJS
```bash
docker-compose logs -f backend | grep Claude
```

### FastAPI
```bash
tail -f /tmp/fastapi.log | grep claude
```

### Claude CLI (via projeto)
```bash
# Verificar logs do Claude no projeto
sudo -u bender cat /home/bender/.claude/history.jsonl | tail -5
```

## 🔐 Segurança

- ✅ Credenciais OAuth separadas por agente
- ✅ Execução isolada via `su` com usuários separados
- ✅ Permissões restritas (only owner + execute for others)
- ✅ Timeout de 5 minutos para evitar processos travados
- ✅ Logs completos de todas as execuções

## 📈 Benefícios

1. **Load Balancing**: Distribuição 50/50 entre agentes
2. **Contexto Compartilhado**: Histórico unificado via symlinks
3. **Isolamento**: Credenciais e processos separados
4. **Escalabilidade**: Fácil adicionar mais agentes
5. **Rastreabilidade**: Logs completos de todas as execuções
6. **Resiliência**: Se um agente falha, outro pode assumir
