FROM node:18-alpine

WORKDIR /app

# Instalar dependências do sistema (bash, shadow para runuser)
RUN apk add --no-cache bash shadow

COPY package*.json ./

RUN npm ci && npm cache clean --force

COPY . .

RUN npm run build

RUN npm ci --only=production && npm cache clean --force

# Instalar Claude Code CLI globalmente
RUN npm install -g @anthropic-ai/claude-code

EXPOSE 3001

CMD ["node", "dist/src/main"]