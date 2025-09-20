import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConsoleService } from './console.service';
import { ConsoleController } from './console.controller';
import { ConsoleGateway } from './console.gateway';
import { SshSession } from '../../entities/ssh-session.entity';
import { ConsoleLog } from '../../entities/console-log.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([SshSession, ConsoleLog])
    ],
    controllers: [ConsoleController],
    providers: [ConsoleService, ConsoleGateway],
    exports: [ConsoleService, ConsoleGateway],
})
export class ConsoleModule { }
