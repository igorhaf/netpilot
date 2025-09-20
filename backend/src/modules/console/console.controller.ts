import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Query,
    UseGuards,
    Request,
    ParseIntPipe,
    DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { ConsoleService } from './console.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import {
    CreateSshSessionDto,
    UpdateSshSessionDto,
    ExecuteCommandDto,
    ConnectSshSessionDto,
    SshSessionResponseDto,
    CommandExecutionResponseDto
} from '../../dtos/ssh-session.dto';

@ApiTags('console')
@Controller('console')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ConsoleController {
    constructor(private readonly consoleService: ConsoleService) { }

    @Post('sessions')
    @ApiOperation({ summary: 'Criar nova sessão SSH' })
    @ApiResponse({ type: SshSessionResponseDto })
    async createSession(
        @Request() req,
        @Body() createSshSessionDto: CreateSshSessionDto
    ) {
        return this.consoleService.createSession(req.user.userId, createSshSessionDto);
    }

    @Get('sessions')
    @ApiOperation({ summary: 'Listar sessões SSH do usuário' })
    @ApiResponse({ type: [SshSessionResponseDto] })
    async findAllSessions(@Request() req) {
        return this.consoleService.findUserSessions(req.user.userId);
    }

    @Get('sessions/stats')
    @ApiOperation({ summary: 'Obter estatísticas das sessões' })
    async getSessionStats(@Request() req) {
        return this.consoleService.getUserSessionStats(req.user.userId);
    }

    @Get('sessions/:id')
    @ApiOperation({ summary: 'Obter sessão SSH por ID' })
    @ApiResponse({ type: SshSessionResponseDto })
    async findSession(@Request() req, @Param('id') id: string) {
        return this.consoleService.findSessionById(req.user.userId, id);
    }

    @Patch('sessions/:id')
    @ApiOperation({ summary: 'Atualizar sessão SSH' })
    @ApiResponse({ type: SshSessionResponseDto })
    async updateSession(
        @Request() req,
        @Param('id') id: string,
        @Body() updateSshSessionDto: UpdateSshSessionDto
    ) {
        return this.consoleService.updateSession(req.user.userId, id, updateSshSessionDto);
    }

    @Delete('sessions/:id')
    @ApiOperation({ summary: 'Deletar sessão SSH' })
    async removeSession(@Request() req, @Param('id') id: string) {
        await this.consoleService.deleteSession(req.user.userId, id);
        return { message: 'Sessão removida com sucesso' };
    }

    @Post('sessions/:id/connect')
    @ApiOperation({ summary: 'Conectar à sessão SSH' })
    async connectSession(@Request() req, @Param('id') sessionId: string) {
        const connected = await this.consoleService.connectToSession(req.user.userId, sessionId);
        return {
            sessionId,
            connected,
            message: connected ? 'Conectado com sucesso' : 'Falha na conexão'
        };
    }

    @Post('sessions/:id/disconnect')
    @ApiOperation({ summary: 'Desconectar da sessão SSH' })
    async disconnectSession(@Request() req, @Param('id') sessionId: string) {
        await this.consoleService.disconnectSession(req.user.userId, sessionId);
        return {
            sessionId,
            message: 'Desconectado com sucesso'
        };
    }

    @Get('sessions/:id/status')
    @ApiOperation({ summary: 'Verificar status de conexão da sessão' })
    async getSessionStatus(@Request() req, @Param('id') sessionId: string) {
        const connected = this.consoleService.isSessionConnected(req.user.userId, sessionId);
        return {
            sessionId,
            connected,
            status: connected ? 'connected' : 'disconnected'
        };
    }

    @Post('execute')
    @ApiOperation({ summary: 'Executar comando SSH' })
    @ApiResponse({ type: CommandExecutionResponseDto })
    async executeCommand(
        @Request() req,
        @Body() executeCommandDto: ExecuteCommandDto
    ) {
        return this.consoleService.executeCommand(req.user.userId, executeCommandDto);
    }

    @Get('sessions/:id/logs')
    @ApiOperation({ summary: 'Obter logs de comandos da sessão' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    async getCommandLogs(
        @Request() req,
        @Param('id') sessionId: string,
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number
    ) {
        return this.consoleService.getCommandLogs(req.user.userId, sessionId, page, limit);
    }

    @Get('logs')
    @ApiOperation({ summary: 'Obter todos os logs de comandos do usuário' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    async getAllCommandLogs(
        @Request() req,
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
        @Query('sessionId') sessionId?: string
    ) {
        if (sessionId) {
            return this.consoleService.getCommandLogs(req.user.userId, sessionId, page, limit);
        }

        // Implementar busca geral de logs se necessário
        return { logs: [], total: 0 };
    }
}
