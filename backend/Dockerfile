FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci && npm cache clean --force

COPY . .

RUN npm run build

RUN npm ci --only=production && npm cache clean --force

EXPOSE 3001

CMD ["node", "dist/src/main"]