#!/bin/bash

# Script para configurar agentes Claude Code compartilhados
# Bender (master) e Marvin (slave) compartilham histórico e projetos

echo "🤖 Configurando Agentes Claude Code..."
echo ""

MASTER_USER="bender"
SLAVE_USER="marvin"

# Verificar se os usuários existem
if ! id "$MASTER_USER" &>/dev/null; then
    echo "❌ Usuário $MASTER_USER não existe. Crie-o primeiro."
    exit 1
fi

if ! id "$SLAVE_USER" &>/dev/null; then
    echo "❌ Usuário $SLAVE_USER não existe. Crie-o primeiro."
    exit 1
fi

echo "✅ Usuários encontrados: $MASTER_USER e $SLAVE_USER"
echo ""

# Criar estrutura no master (bender)
echo "📁 Configurando estrutura do $MASTER_USER..."
sudo -u $MASTER_USER mkdir -p /home/$MASTER_USER/.claude/projects
sudo -u $MASTER_USER mkdir -p /home/$MASTER_USER/.claude/file-history
sudo -u $MASTER_USER touch /home/$MASTER_USER/.claude/history.jsonl

echo "✅ Estrutura do $MASTER_USER criada"
echo ""

# Criar .claude no slave se não existir
echo "📁 Preparando $SLAVE_USER..."
sudo -u $SLAVE_USER mkdir -p /home/$SLAVE_USER/.claude

# Remover arquivos/pastas existentes no slave (se houver)
sudo rm -rf /home/$SLAVE_USER/.claude/history.jsonl
sudo rm -rf /home/$SLAVE_USER/.claude/projects
sudo rm -rf /home/$SLAVE_USER/.claude/file-history

# Criar symlinks do slave para o master
echo "🔗 Criando symlinks compartilhados..."

sudo -u $SLAVE_USER ln -s /home/$MASTER_USER/.claude/history.jsonl /home/$SLAVE_USER/.claude/history.jsonl
sudo -u $SLAVE_USER ln -s /home/$MASTER_USER/.claude/projects /home/$SLAVE_USER/.claude/projects
sudo -u $SLAVE_USER ln -s /home/$MASTER_USER/.claude/file-history /home/$SLAVE_USER/.claude/file-history

echo "✅ Symlinks criados:"
echo "   - /home/$SLAVE_USER/.claude/history.jsonl -> /home/$MASTER_USER/.claude/history.jsonl"
echo "   - /home/$SLAVE_USER/.claude/projects -> /home/$MASTER_USER/.claude/projects"
echo "   - /home/$SLAVE_USER/.claude/file-history -> /home/$MASTER_USER/.claude/file-history"
echo ""

# Verificar permissões
echo "🔐 Ajustando permissões..."
sudo chown -R $MASTER_USER:$MASTER_USER /home/$MASTER_USER/.claude
sudo chmod -R 755 /home/$MASTER_USER/.claude

echo "✅ Permissões ajustadas"
echo ""

# Testar symlinks
echo "🧪 Testando symlinks..."
if [ -L "/home/$SLAVE_USER/.claude/history.jsonl" ]; then
    echo "✅ history.jsonl linkado corretamente"
else
    echo "❌ Erro no link de history.jsonl"
fi

if [ -L "/home/$SLAVE_USER/.claude/projects" ]; then
    echo "✅ projects linkado corretamente"
else
    echo "❌ Erro no link de projects"
fi

if [ -L "/home/$SLAVE_USER/.claude/file-history" ]; then
    echo "✅ file-history linkado corretamente"
else
    echo "❌ Erro no link de file-history"
fi

echo ""
echo "🎉 Configuração concluída!"
echo ""
echo "📝 Próximos passos:"
echo "   1. Faça login no Claude Code em ambos os usuários:"
echo "      su - $MASTER_USER -c 'claude auth'"
echo "      su - $SLAVE_USER -c 'claude auth'"
echo ""
echo "   2. Agora os agentes compartilham:"
echo "      - Histórico de conversas"
echo "      - Projetos Claude"
echo "      - Histórico de arquivos"
echo ""
echo "   3. Reinicie o backend para aplicar as mudanças"
