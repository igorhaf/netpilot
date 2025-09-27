"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const platform_socket_io_1 = require("@nestjs/platform-socket.io");
const app_module_1 = require("./app.module");
const initial_seed_1 = require("./seeds/initial-seed");
class CustomIoAdapter extends platform_socket_io_1.IoAdapter {
    createIOServer(port, options) {
        const server = super.createIOServer(port, {
            ...options,
            cors: {
                origin: true,
                methods: ['GET', 'POST'],
                allowedHeaders: ['Authorization', 'Content-Type'],
                credentials: true,
            },
            allowEIO3: true,
            transports: ['websocket', 'polling'],
        });
        return server;
    }
}
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.useWebSocketAdapter(new CustomIoAdapter(app));
    app.enableCors({
        origin: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
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
    await app.listen(port, '0.0.0.0');
    console.log(`🚀 NetPilot Backend running on https://netpilot.meadadigital.com/api`);
    console.log(`📚 Swagger docs available at https://netpilot.meadadigital.com/api/docs`);
}
bootstrap();
//# sourceMappingURL=main.js.map