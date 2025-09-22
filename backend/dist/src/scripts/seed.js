"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("../app.module");
const initial_seed_1 = require("../seeds/initial-seed");
async function bootstrap() {
    console.log('🌱 Iniciando execução dos seeds...');
    try {
        const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule, {
            logger: false,
        });
        const seedService = app.get(initial_seed_1.InitialSeedService);
        await seedService.seed();
        await app.close();
        console.log('✅ Seeds executados com sucesso!');
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Erro ao executar seeds:', error.message);
        process.exit(1);
    }
}
bootstrap();
//# sourceMappingURL=seed.js.map