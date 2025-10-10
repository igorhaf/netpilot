#!/bin/bash

# ==============================================================================
# Script de Setup dos Agentes Claude Code (bender e marvin)
# ==============================================================================
#
# CENÁRIO:
# - 2 agentes Claude CLI: bender (master) e marvin (slave)
# - Ambos compartilham histórico/contexto via symlinks
# - Cada agente tem suas próprias credenciais OAuth
# - Execuções devem ser TOTALMENTE permissivas (sem interação)
# - Usado para executar prompts via chat → fila → FastAPI → Claude CLI
#
# REQUISITOS:
# 1. Bender e marvin logados no Claude CLI
# 2. Histórico compartilhado: /home/bender/.claude/history.jsonl
# 3. Projetos compartilhados: /home/bender/.claude/projects/
# 4. File-history compartilhado: /home/bender/.claude/file-history/
# 5. Credenciais SEPARADAS: cada agente tem seu .credentials.json
# 6. Execução sem permissões: --permission-mode bypassPermissions
#
# ==============================================================================

set -e

echo "🚀 ===== SETUP DOS AGENTES CLAUDE CODE ====="
echo ""

# ==============================================================================
# 1. Verificar se usuários existem
# ==============================================================================

echo "📋 [1/6] Verificando usuários..."

if ! id bender &>/dev/null; then
    echo "❌ Usuário 'bender' não encontrado!"
    echo "   Execute: sudo useradd -m -s /bin/bash bender"
    exit 1
fi

if ! id marvin &>/dev/null; then
    echo "❌ Usuário 'marvin' não encontrado!"
    echo "   Execute: sudo useradd -m -s /bin/bash marvin"
    exit 1
fi

echo "✅ Usuários bender e marvin existem"
echo ""

# ==============================================================================
# 2. Verificar se Claude CLI está instalado
# ==============================================================================

echo "📋 [2/6] Verificando Claude CLI..."

if ! command -v claude &>/dev/null; then
    echo "❌ Claude CLI não encontrado!"
    echo "   Execute: npm install -g @anthropic-ai/claude-code"
    exit 1
fi

CLAUDE_VERSION=$(claude --version 2>/dev/null || echo "unknown")
echo "✅ Claude CLI instalado: $CLAUDE_VERSION"
echo ""

# ==============================================================================
# 3. Verificar autenticação dos agentes
# ==============================================================================

echo "📋 [3/6] Verificando autenticação..."

BENDER_CREDS="/home/bender/.claude/.credentials.json"
MARVIN_CREDS="/home/marvin/.claude/.credentials.json"

check_auth() {
    local user=$1
    local creds_file=$2

    if [ ! -f "$creds_file" ]; then
        echo "❌ $user não autenticado!"
        echo "   Execute: sudo -u $user claude login"
        return 1
    fi

    # Verificar se token expirou
    local expires_at=$(jq -r '.claudeAiOauth.expiresAt' "$creds_file" 2>/dev/null || echo "0")
    local now=$(date +%s)000  # Converter para milissegundos

    if [ "$expires_at" -lt "$now" ]; then
        echo "⚠️  $user: Token OAuth EXPIRADO (expiresAt: $expires_at, now: $now)"
        echo "   É necessário re-autenticar: sudo -u $user claude login"
        return 1
    fi

    echo "✅ $user autenticado (token válido até $(date -d @$((expires_at/1000)) '+%Y-%m-%d %H:%M:%S'))"
    return 0
}

AUTH_OK=true

if ! check_auth "bender" "$BENDER_CREDS"; then
    AUTH_OK=false
fi

if ! check_auth "marvin" "$MARVIN_CREDS"; then
    AUTH_OK=false
fi

if [ "$AUTH_OK" = false ]; then
    echo ""
    echo "❌ ATENÇÃO: Um ou mais agentes precisam de re-autenticação!"
    echo ""
    echo "Para re-autenticar:"
    echo "  sudo -u bender claude login"
    echo "  sudo -u marvin claude login"
    echo ""
    echo "Isso abrirá o navegador para login OAuth."
    echo ""
    read -p "Deseja continuar mesmo assim? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo ""

# ==============================================================================
# 4. Criar estrutura de diretórios no master (bender)
# ==============================================================================

echo "📋 [4/6] Criando estrutura no master (bender)..."

sudo -u bender mkdir -p /home/bender/.claude/projects
sudo -u bender mkdir -p /home/bender/.claude/file-history
sudo -u bender touch /home/bender/.claude/history.jsonl

sudo chown -R bender:bender /home/bender/.claude
sudo chmod -R 755 /home/bender/.claude

# Manter .credentials.json privado
if [ -f "$BENDER_CREDS" ]; then
    sudo chmod 600 "$BENDER_CREDS"
fi

echo "✅ Estrutura do bender criada"
echo ""

# ==============================================================================
# 5. Criar symlinks no slave (marvin)
# ==============================================================================

echo "📋 [5/6] Criando symlinks no slave (marvin)..."

# Criar diretório .claude se não existir
sudo -u marvin mkdir -p /home/marvin/.claude

# Remover arquivos/symlinks antigos (exceto .credentials.json)
sudo rm -f /home/marvin/.claude/history.jsonl
sudo rm -rf /home/marvin/.claude/projects
sudo rm -rf /home/marvin/.claude/file-history

# Criar symlinks apontando para bender
sudo -u marvin ln -sf /home/bender/.claude/history.jsonl /home/marvin/.claude/history.jsonl
sudo -u marvin ln -sf /home/bender/.claude/projects /home/marvin/.claude/projects
sudo -u marvin ln -sf /home/bender/.claude/file-history /home/marvin/.claude/file-history

# Manter .credentials.json privado
if [ -f "$MARVIN_CREDS" ]; then
    sudo chmod 600 "$MARVIN_CREDS"
fi

echo "✅ Symlinks do marvin criados:"
echo "   history.jsonl → /home/bender/.claude/history.jsonl"
echo "   projects → /home/bender/.claude/projects"
echo "   file-history → /home/bender/.claude/file-history"
echo ""

# ==============================================================================
# 6. Verificar estrutura final
# ==============================================================================

echo "📋 [6/6] Verificando estrutura final..."
echo ""

echo "📁 Estrutura do bender:"
ls -la /home/bender/.claude/ | grep -E "(history|projects|file-history|credentials)"

echo ""
echo "📁 Estrutura do marvin:"
ls -la /home/marvin/.claude/ | grep -E "(history|projects|file-history|credentials)"

echo ""
echo "✅ ===== SETUP CONCLUÍDO ====="
echo ""
echo "📝 PRÓXIMOS PASSOS:"
echo ""
echo "1. Se algum agente não estiver autenticado, execute:"
echo "   sudo -u bender claude login"
echo "   sudo -u marvin claude login"
echo ""
echo "2. Testar execução:"
echo "   su -s /bin/bash bender -c 'cd /home/projects/netpilot && claude -p --permission-mode bypassPermissions \"what is 2+2\"'"
echo "   su -s /bin/bash marvin -c 'cd /home/projects/netpilot && claude -p --permission-mode bypassPermissions \"what is 2+2\"'"
echo ""
echo "3. Verificar API FastAPI:"
echo "   curl http://172.18.0.1:8001/claude/health"
echo ""
echo "4. Testar via API:"
echo "   curl -X POST http://172.18.0.1:8001/claude/execute \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"projectPath\": \"/home/projects/netpilot\", \"prompt\": \"liste os arquivos\", \"agent\": \"bender\"}'"
echo ""
