FROM python:3.12-slim

WORKDIR /app

# Instalar dependências do sistema
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    make \
    libpq-dev \
    openssh-client \
    docker.io \
    certbot \
    && rm -rf /var/lib/apt/lists/*

# Copiar requirements e instalar dependências Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código da aplicação
COPY . .

# Criar diretórios necessários
RUN mkdir -p /etc/ssl/netpilot /etc/letsencrypt /var/www/certbot /var/log

# Expor porta
EXPOSE 8001

# Comando para iniciar a aplicação
CMD ["python", "main.py"]
