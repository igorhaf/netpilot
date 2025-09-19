import {
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { LogsService } from './logs.service';
import { LogType, LogStatus } from '../../entities/log.entity';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';

@ApiTags('logs')
@Controller('logs')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class LogsController {
  constructor(private readonly logsService: LogsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar logs' })
  @ApiQuery({ name: 'type', required: false, enum: LogType })
  @ApiQuery({ name: 'status', required: false, enum: LogStatus })
  findAll(
    @Query('type') type?: LogType,
    @Query('status') status?: LogStatus,
  ) {
    return this.logsService.findAll(type, status);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Obter estatísticas dos logs' })
  getStats() {
    return this.logsService.getStats();
  }

  @Get('recent')
  @ApiOperation({ summary: 'Obter logs recentes' })
  @ApiQuery({ name: 'limit', required: false })
  getRecent(@Query('limit') limit?: number) {
    return this.logsService.getRecentLogs(limit ? parseInt(limit.toString()) : 10);
  }

  @Post('clear')
  @ApiOperation({ summary: 'Limpar todos os logs' })
  clearLogs() {
    return this.logsService.clearLogs();
  }

  @Get('export')
  async exportLogs(
    @Query('type') type?: LogType,
    @Query('status') status?: LogStatus,
  ) {
    return await this.logsService.exportLogs(type, status);
  }

}