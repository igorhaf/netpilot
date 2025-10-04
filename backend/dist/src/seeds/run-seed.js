"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const typeorm_1 = require("typeorm");
const stacks_presets_seed_1 = require("./stacks-presets.seed");
const dotenv = require("dotenv");
dotenv.config();
const AppDataSource = new typeorm_1.DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'db',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USER || 'netpilot',
    password: process.env.DB_PASSWORD || 'netpilot123',
    database: process.env.DB_NAME || 'netpilot',
    entities: ['dist/src/entities/**/*.entity.js'],
    synchronize: false,
});
async function runSeeds() {
    try {
        console.log('🔌 Conectando ao banco de dados...');
        await AppDataSource.initialize();
        console.log('✅ Conectado!');
        const seed = new stacks_presets_seed_1.StacksPresetsSeed();
        await seed.run(AppDataSource);
        console.log('✅ Seeds executados com sucesso!');
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Erro ao executar seeds:', error);
        process.exit(1);
    }
}
runSeeds();
//# sourceMappingURL=run-seed.js.map