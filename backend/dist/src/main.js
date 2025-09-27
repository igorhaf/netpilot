"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const platform_socket_io_1 = require("@nestjs/platform-socket.io");
const app_module_1 = require("./app.module");
const initial_seed_1 = require("./seeds/initial-seed");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.useWebSocketAdapter(new platform_socket_io_1.IoAdapter(app));
    app.enableCors({
        origin: [
            'https://netpilot.meadadigital.com',
            'https://netpilot.meadadigital.com:3000',
            'http://netpilot.meadadigital.com',
            'http://netpilot.meadadigital.com:3000',
            'http://localhost:3000',
            'https://localhost:3000'
        ],
        credentials: true,
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    app.setGlobalPrefix('api');
    const config = new swagger_1.DocumentBuilder()
        .setTitle('NetPilot API')
        .setDescription('Sistema de Proxy Reverso e Gestão SSL')
        .setVersion('1.0')
        .addBearerAuth()
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api/docs', app, document);
    if (process.env.NODE_ENV === 'development') {
        const seedService = app.get(initial_seed_1.InitialSeedService);
        await seedService.seed();
    }
    const port = process.env.PORT || 3001;
    await app.listen(port);
    console.log(`🚀 NetPilot Backend running on https://netpilot.meadadigital.com/api`);
    console.log(`📚 Swagger docs available at https://netpilot.meadadigital.com/api/docs`);
}
bootstrap();
//# sourceMappingURL=main.js.map