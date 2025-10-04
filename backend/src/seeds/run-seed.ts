import { DataSource } from 'typeorm';
import { StacksPresetsSeed } from './stacks-presets.seed';
import * as dotenv from 'dotenv';

dotenv.config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'db',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'netpilot',
  password: process.env.DB_PASSWORD || 'netpilot123',
  database: process.env.DB_NAME || 'netpilot',
  entities: ['dist/src/entities/**/*.entity.js'], // Usar dist em produção
  synchronize: false,
});

async function runSeeds() {
  try {
    console.log('🔌 Conectando ao banco de dados...');
    await AppDataSource.initialize();
    console.log('✅ Conectado!');

    const seed = new StacksPresetsSeed();
    await seed.run(AppDataSource);

    console.log('✅ Seeds executados com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao executar seeds:', error);
    process.exit(1);
  }
}

runSeeds();
