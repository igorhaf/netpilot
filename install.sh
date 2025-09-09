#!/bin/bash

# NetPilot - Instalação Simplificada via Laravel Sail
# Execute: bash install.sh

set -e

echo "🚀 NetPilot - Instalação Automatizada"
echo "====================================="

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Docker não encontrado. Instalando..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    echo "✅ Docker instalado. REINICIE o terminal e execute novamente."
    exit 1
fi

# Verificar se Docker Compose está disponível
if ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose não encontrado. Instalando..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

echo "📁 Preparando diretórios..."
# Criar diretórios necessários
mkdir -p traefik/dynamic
mkdir -p storage/certs
mkdir -p storage/letsencrypt

# Criar arquivo ACME com permissões corretas
touch traefik/acme.json
chmod 600 traefik/acme.json

# Permissões dos diretórios dinâmicos
chmod -R 777 traefik/dynamic/

echo "⚙️  Configurando ambiente..."
# Copiar .env se não existir
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✅ Arquivo .env criado"
fi

# Instalar dependências do Composer via Docker
echo "📦 Instalando dependências PHP..."
docker run --rm \
    -u "$(id -u):$(id -g)" \
    -v $(pwd):/var/www/html \
    -w /var/www/html \
    laravelsail/php84-composer:latest \
    composer install --optimize-autoloader

# Gerar chave da aplicação
echo "🔑 Gerando chave da aplicação..."
./vendor/bin/sail artisan key:generate --force

echo "🐳 Iniciando containers..."
# Subir os containers
./vendor/bin/sail up -d

# Aguardar containers iniciarem
echo "⏳ Aguardando containers iniciarem..."
sleep 10

echo "🗄️  Configurando banco de dados..."
# Executar migrações
./vendor/bin/sail artisan migrate --force

echo "🎨 Instalando dependências do frontend..."
# Instalar dependências do frontend
./vendor/bin/sail npm install

# Compilar assets
./vendor/bin/sail npm run build

echo "🧹 Otimizando aplicação..."
# Limpar e otimizar cache
./vendor/bin/sail artisan config:clear
./vendor/bin/sail artisan cache:clear
./vendor/bin/sail artisan view:clear
./vendor/bin/sail artisan optimize

echo "🔗 Criando link de storage..."
./vendor/bin/sail artisan storage:link

echo ""
echo "🎉 Instalação concluída!"
echo "========================"
echo ""
echo "🌐 Acesse a aplicação:"
echo "   • Interface: http://localhost:8484"
echo "   • Traefik Dashboard: http://localhost:8080"
echo ""
echo "⚡ Comandos úteis:"
echo "   • Iniciar: ./vendor/bin/sail up -d"
echo "   • Parar: ./vendor/bin/sail down"
echo "   • Logs: ./vendor/bin/sail logs -f"
echo "   • Queue Worker: ./vendor/bin/sail artisan queue:work"
echo ""
echo "📋 Próximos passos:"
echo "   1. Configure seu domínio no DNS apontando para este servidor"
echo "   2. Abra as portas 80 e 443 no firewall"
echo "   3. Acesse a interface e crie seu primeiro domínio"
echo ""
echo "✅ NetPilot está pronto para uso!"
