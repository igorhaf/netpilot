import {
    IsString,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsEnum,
    IsBoolean,
    Min,
    Max,
    IsObject,
    ValidateIf,
    MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CreateSshSessionDto {
    @ApiProperty({
        description: 'Nome da sessão SSH',
        example: 'Servidor Produção',
    })
    @IsString()
    @IsNotEmpty()
    @MinLength(3)
    sessionName: string;

    @ApiProperty({
        description: 'Hostname ou IP do servidor',
        example: '192.168.1.100',
    })
    @IsString()
    @IsNotEmpty()
    hostname: string;

    @ApiProperty({
        description: 'Porta SSH',
        example: 22,
        minimum: 1,
        maximum: 65535,
    })
    @IsNumber()
    @Min(1)
    @Max(65535)
    port: number;

    @ApiProperty({
        description: 'Nome de usuário SSH',
        example: 'admin',
    })
    @IsString()
    @IsNotEmpty()
    username: string;

    @ApiProperty({
        description: 'Tipo de autenticação',
        enum: ['password', 'key'],
        example: 'password',
    })
    @IsEnum(['password', 'key'])
    authType: 'password' | 'key';

    @ApiPropertyOptional({
        description: 'Senha (obrigatório se authType for password)',
        example: 'password123',
    })
    @ValidateIf((o) => o.authType === 'password')
    @IsString()
    @IsNotEmpty()
    password?: string;

    @ApiPropertyOptional({
        description: 'Chave privada SSH (obrigatório se authType for key)',
    })
    @ValidateIf((o) => o.authType === 'key')
    @IsString()
    @IsNotEmpty()
    privateKey?: string;

    @ApiPropertyOptional({
        description: 'Passphrase da chave privada',
    })
    @IsOptional()
    @IsString()
    passphrase?: string;

    @ApiPropertyOptional({
        description: 'Descrição da sessão',
        example: 'Servidor de produção principal',
    })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({
        description: 'Opções adicionais de conexão',
        example: {
            keepaliveInterval: 60000,
            readyTimeout: 20000,
            algorithms: {
                kex: ['diffie-hellman-group1-sha1'],
                cipher: ['aes128-ctr', 'aes192-ctr'],
            },
        },
    })
    @IsOptional()
    @IsObject()
    connectionOptions?: Record<string, any>;

    @ApiPropertyOptional({
        description: 'Se a sessão está ativa',
        example: true,
    })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}

export class UpdateSshSessionDto extends PartialType(CreateSshSessionDto) { }

export class ConnectSshSessionDto {
    @ApiProperty({
        description: 'ID da sessão SSH para conectar',
        example: 'uuid-session-id',
    })
    @IsString()
    @IsNotEmpty()
    sessionId: string;
}

export class ExecuteCommandDto {
    @ApiProperty({
        description: 'Comando a ser executado',
        example: 'ls -la',
    })
    @IsString()
    @IsNotEmpty()
    command: string;

    @ApiProperty({
        description: 'ID da sessão SSH',
        example: 'uuid-session-id',
    })
    @IsString()
    @IsNotEmpty()
    sessionId: string;

    @ApiPropertyOptional({
        description: 'Diretório de trabalho',
        example: '/home/user',
    })
    @IsOptional()
    @IsString()
    workingDirectory?: string;

    @ApiPropertyOptional({
        description: 'Variáveis de ambiente',
        example: {
            NODE_ENV: 'production',
            PATH: '/usr/local/bin:/usr/bin',
        },
    })
    @IsOptional()
    @IsObject()
    environment?: Record<string, string>;

    @ApiPropertyOptional({
        description: 'Timeout em milissegundos',
        example: 30000,
        minimum: 1000,
        maximum: 300000,
    })
    @IsOptional()
    @IsNumber()
    @Min(1000)
    @Max(300000)
    timeout?: number;
}

export class SshSessionResponseDto {
    @ApiProperty({
        description: 'ID da sessão',
        example: 'uuid-session-id',
    })
    id: string;

    @ApiProperty({
        description: 'Nome da sessão',
        example: 'Servidor Produção',
    })
    sessionName: string;

    @ApiProperty({
        description: 'Hostname',
        example: '192.168.1.100',
    })
    hostname: string;

    @ApiProperty({
        description: 'Porta SSH',
        example: 22,
    })
    port: number;

    @ApiProperty({
        description: 'Nome de usuário',
        example: 'admin',
    })
    username: string;

    @ApiProperty({
        description: 'Tipo de autenticação',
        example: 'password',
    })
    authType: string;

    @ApiProperty({
        description: 'Status da sessão',
        example: 'active',
    })
    status: string;

    @ApiProperty({
        description: 'Última conexão',
        example: '2024-01-01T12:00:00Z',
    })
    lastConnectedAt: Date;

    @ApiProperty({
        description: 'Contagem de comandos executados',
        example: 42,
    })
    commandCount: number;

    @ApiProperty({
        description: 'Data de criação',
        example: '2024-01-01T10:00:00Z',
    })
    createdAt: Date;
}

export class CommandExecutionResponseDto {
    @ApiProperty({
        description: 'ID do log de execução',
        example: 'uuid-log-id',
    })
    id: string;

    @ApiProperty({
        description: 'Comando executado',
        example: 'ls -la',
    })
    command: string;

    @ApiProperty({
        description: 'Saída do comando',
        example: 'total 24\ndrwxr-xr-x 3 user user 4096 Jan 1 12:00 .',
    })
    output: string;

    @ApiProperty({
        description: 'Saída de erro',
        example: '',
    })
    errorOutput: string;

    @ApiProperty({
        description: 'Código de saída',
        example: 0,
    })
    exitCode: number;

    @ApiProperty({
        description: 'Tempo de execução em ms',
        example: 150,
    })
    executionTime: number;

    @ApiProperty({
        description: 'Status da execução',
        example: 'completed',
    })
    status: string;

    @ApiProperty({
        description: 'Data de execução',
        example: '2024-01-01T12:00:00Z',
    })
    executedAt: Date;
}
