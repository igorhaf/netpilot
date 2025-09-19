import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';

@ApiTags('dashboard')
@Controller('dashboard')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Obter estatísticas do dashboard' })
  getStats() {
    return this.dashboardService.getDashboardStats();
  }

  @Get('recent-logs')
  @ApiOperation({ summary: 'Obter logs recentes para o dashboard' })
  @ApiQuery({ name: 'limit', required: false })
  getRecentLogs(@Query('limit') limit?: number) {
    return this.dashboardService.getRecentLogs(limit ? parseInt(limit.toString()) : 5);
  }

  @Get('expiring-certificates')
  @ApiOperation({ summary: 'Obter certificados expirando' })
  @ApiQuery({ name: 'days', required: false })
  getExpiringCertificates(@Query('days') days?: number) {
    return this.dashboardService.getExpiringCertificates(days ? parseInt(days.toString()) : 30);
  }
}