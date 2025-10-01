#!/bin/bash

# Job: Monitorar Resultado DEIT
# Descrição: Lê o arquivo de resultado do projeto DEIT
# Executado a cada 5 minutos

echo "=== Início da execução: $(date '+%Y-%m-%d %H:%M:%S') ==="
echo "Local: /home/projects/deit/"
echo "Arquivo: resultado_20250928_213846.txt"
echo ""

# Verificar se o arquivo existe
if [ ! -f "/home/projects/deit/resultado_20250928_213846.txt" ]; then
    echo "❌ ERRO: Arquivo não encontrado!"
    exit 1
fi

# Ler o conteúdo do arquivo
echo "📄 Conteúdo do arquivo:"
echo "─────────────────────────────────────"
cat /home/projects/deit/resultado_20250928_213846.txt
echo "─────────────────────────────────────"
echo ""

# Informações adicionais
FILE_SIZE=$(stat -f%z "/home/projects/deit/resultado_20250928_213846.txt" 2>/dev/null || stat -c%s "/home/projects/deit/resultado_20250928_213846.txt" 2>/dev/null)
FILE_MODIFIED=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M:%S" "/home/projects/deit/resultado_20250928_213846.txt" 2>/dev/null || stat -c "%y" "/home/projects/deit/resultado_20250928_213846.txt" 2>/dev/null | cut -d'.' -f1)

echo "📊 Informações do arquivo:"
echo "  • Tamanho: ${FILE_SIZE} bytes"
echo "  • Última modificação: ${FILE_MODIFIED}"
echo ""

echo "✅ Execução concluída com sucesso!"
echo "=== Fim da execução: $(date '+%Y-%m-%d %H:%M:%S') ==="

exit 0