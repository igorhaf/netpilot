# 🤖 Sistema de Agentes Claude Code

Este sistema utiliza dois agentes Claude Code (`bender` e `marvin`) que compartilham contexto e histórico para permitir trabalho paralelo sem perder contexto entre projetos.

## Arquitetura

### Agentes

- **Bender (Master)** - Agente principal que armazena todos os dados
- **Marvin (Slave)** - Agente secundário que compartilha dados via symlinks

### Arquivos Compartilhados

Todos os seguintes arquivos de `marvin` são symlinks para `bender`:

```
/home/bender/.claude/history.jsonl       ←→  /home/marvin/.claude/history.jsonl
/home/bender/.claude/projects/           ←→  /home/marvin/.claude/projects/
/home/bender/.claude/file-history/       ←→  /home/marvin/.claude/file-history/
```

**Arquivos NÃO compartilhados (credenciais separadas):**
- `/home/bender/.claude/config.json` (credenciais do bender)
- `/home/marvin/.claude/config.json` (credenciais do marvin)

## Instalação e Configuração

### 1. Criar os usuários

```bash
# Criar usuário bender
sudo useradd -m -s /bin/bash bender

# Criar usuário marvin
sudo useradd -m -s /bin/bash marvin
```

### 2. Instalar Claude Code globalmente

```bash
npm install -g @anthropic-ai/claude-code
```

### 3. Fazer login em cada agente

```bash
# Login no bender
su - bender
claude auth
# Cole a API key da conta 1
exit

# Login no marvin
su - marvin
claude auth
# Cole a API key da conta 2
exit
```

### 4. Configurar symlinks

Execute o script de setup:

```bash
cd /home/projects/netpilot/backend
./scripts/setup-claude-agents.sh
```

Isso irá:
- Criar a estrutura de pastas em `bender`
- Criar symlinks de `marvin` → `bender`
- Ajustar permissões

### 5. Reiniciar o backend

```bash
docker-compose restart backend
```

## Como Funciona

### Execução de Prompts IA

Quando você envia um prompt no modo **IA** (azul):

1. **Backend escolhe aleatoriamente** entre `bender` ou `marvin`
2. **Executa o comando** como o usuário escolhido:
   ```bash
   su - bender -c 'cd /home/deit/code && claude --continue "seu prompt aqui"'
   ```
3. **Compartilha contexto** via symlinks - ambos veem o mesmo histórico
4. **Saída capturada** e gravada no banco de dados
5. **Exibida no chat** com persistência

### Balanceamento de Carga

- 50% das requisições vão para `bender`
- 50% das requisições vão para `marvin`
- Ambos compartilham o mesmo contexto
- Limite de API duplicado (2x mais requisições/minuto)

### Modo Terminal

No modo **Terminal** (verde), os comandos são executados diretamente no diretório do projeto sem usar os agentes Claude.

## Vantagens

✅ **Contexto unificado** - Ambos agentes veem o mesmo histórico
✅ **Limite de API duplicado** - 2 contas = 2x mais requisições
✅ **Balanceamento automático** - Distribuição aleatória
✅ **Credenciais separadas** - Cada agente usa sua própria API key
✅ **Persistência total** - Todo histórico salvo no banco de dados

## Estrutura de Diretórios

```
/home/
├── bender/
│   ├── .claude/
│   │   ├── config.json          # Credenciais próprias (NÃO compartilhado)
│   │   ├── history.jsonl        # MASTER - Histórico compartilhado
│   │   ├── projects/            # MASTER - Projetos compartilhados
│   │   └── file-history/        # MASTER - Histórico de arquivos
│   └── ...
│
├── marvin/
│   ├── .claude/
│   │   ├── config.json          # Credenciais próprias (NÃO compartilhado)
│   │   ├── history.jsonl  →  /home/bender/.claude/history.jsonl (symlink)
│   │   ├── projects/      →  /home/bender/.claude/projects/ (symlink)
│   │   └── file-history/  →  /home/bender/.claude/file-history/ (symlink)
│   └── ...
│
└── deit/  (e outros projetos)
    └── code/  # Diretório onde Claude Code executa
```

## Verificação

Para verificar se está funcionando:

```bash
# Verificar symlinks
ls -la /home/marvin/.claude/

# Deve mostrar:
# history.jsonl -> /home/bender/.claude/history.jsonl
# projects -> /home/bender/.claude/projects
# file-history -> /home/bender/.claude/file-history
```

## Troubleshooting

### Erro: "su: command not found"

O backend está rodando em Docker e não tem `su`. Modifique o Dockerfile para incluir:

```dockerfile
RUN apk add --no-cache shadow
```

### Erro: "Permission denied"

Ajuste permissões:

```bash
sudo chown -R bender:bender /home/bender/.claude
sudo chmod -R 755 /home/bender/.claude
```

### Symlinks quebrados

Re-execute o script de setup:

```bash
./scripts/setup-claude-agents.sh
```

## Logs

Para ver qual agente está sendo usado:

```
🤖 Claude Code - BENDER
📁 Projeto: Deit
👤 Agente: bender
📂 Diretório: /home/deit/code
```

ou

```
🤖 Claude Code - MARVIN
📁 Projeto: Deit
👤 Agente: marvin
📂 Diretório: /home/deit/code
```
