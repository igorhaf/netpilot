import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ConsoleService } from './console.service';
import { ConsoleController } from './console.controller';
import { ConsoleGateway } from './console.gateway';
import { SshSession } from '../../entities/ssh-session.entity';
import { ConsoleLog } from '../../entities/console-log.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([SshSession, ConsoleLog]),
        JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: (configService: ConfigService) => ({
                secret: configService.get<string>('JWT_SECRET'),
                signOptions: { expiresIn: configService.get<string>('JWT_EXPIRES_IN') || '7d' },
            }),
            inject: [ConfigService],
        }),
    ],
    controllers: [ConsoleController],
    providers: [ConsoleService, ConsoleGateway],
    exports: [ConsoleService, ConsoleGateway],
})
export class ConsoleModule { }
