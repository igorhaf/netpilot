# MySQL no NetPilot

## 📊 Configuração Implementada

O serviço MySQL foi adicionado ao ambiente Docker com as seguintes configurações:

### Detalhes do Serviço
- **Imagem:** `mysql:8.0`
- **Container:** `netpilot-mysql`
- **Database:** `netpilot`
- **Usuário:** `netpilot`
- **Senha:** `netpilot123`
- **Porta Externa:** `3307`
- **Porta Interna:** `3306`
- **Volume:** `mysql_data`

## 🔗 Strings de Conexão

### Conexão Interna (entre containers)
```
mysql://netpilot:netpilot123@mysql:3306/netpilot
```

### Conexão Externa (do host)
```
mysql://netpilot:netpilot123@localhost:3307/netpilot
```

### Variável de Ambiente no Backend
```bash
MYSQL_URL=mysql://netpilot:netpilot123@mysql:3306/netpilot
```

## 🛠️ Usando MySQL no Backend NestJS

### 1. Instalar Dependências
```bash
npm install mysql2 @nestjs/typeorm
```

### 2. Configurar TypeORM (app.module.ts)
```typescript
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    // PostgreSQL (atual)
    TypeOrmModule.forRootAsync({
      name: 'postgres',
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get('DATABASE_URL'),
        // ... outras configurações
      }),
    }),
    
    // MySQL (novo)
    TypeOrmModule.forRootAsync({
      name: 'mysql',
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        url: configService.get('MYSQL_URL'),
        entities: [/* suas entidades MySQL */],
        synchronize: process.env.NODE_ENV === 'development',
        logging: process.env.NODE_ENV === 'development',
      }),
    }),
  ],
})
export class AppModule {}
```

### 3. Usar em Entidades
```typescript
// Para PostgreSQL (padrão)
@Entity()
export class PostgresEntity {
  // ...
}

// Para MySQL
@Entity()
export class MySqlEntity {
  // ...
}

// No módulo
TypeOrmModule.forFeature([PostgresEntity], 'postgres'),
TypeOrmModule.forFeature([MySqlEntity], 'mysql'),
```

## 🔧 Comandos Úteis

### Acessar MySQL via CLI
```bash
docker exec -it netpilot-mysql mysql -u netpilot -pnetpilot123 netpilot
```

### Backup MySQL
```bash
docker exec netpilot-mysql mysqldump -u netpilot -pnetpilot123 netpilot > backup.sql
```

### Restore MySQL
```bash
docker exec -i netpilot-mysql mysql -u netpilot -pnetpilot123 netpilot < backup.sql
```

## 📊 Status dos Bancos

Agora você tem **DOIS** bancos de dados funcionando simultaneamente:

- **PostgreSQL:** `localhost:5432` (principal)
- **MySQL:** `localhost:3307` (secundário)
- **phpMyAdmin:** `localhost:8090` (interface web MySQL)
- **pgAdmin:** `localhost:8091` (interface web PostgreSQL)

Ambos estão na mesma rede Docker (`netpilot-network`) e podem ser acessados pelo backend.

## 🌐 phpMyAdmin - Interface Web

### Acesso
- **URL:** `http://localhost:8090`
- **Usuário:** `netpilot`
- **Senha:** `netpilot123`
- **Servidor:** `mysql` (conecta automaticamente)

### Funcionalidades
- Interface gráfica para gerenciar MySQL
- Execução de queries SQL
- Import/Export de dados
- Gerenciamento de tabelas e estruturas
- Backup e restore via interface

## ⚠️ Observações

- O MySQL está configurado para usar a mesma senha do PostgreSQL por simplicidade
- Use conexões diferentes conforme necessário no seu código
- Ambos os bancos têm healthchecks configurados
- Os dados são persistidos em volumes Docker separados
