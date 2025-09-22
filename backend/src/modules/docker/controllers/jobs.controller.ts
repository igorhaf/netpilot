import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Request,
  DefaultValuePipe,
  ParseIntPipe
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';
import { JobsService } from '../services/jobs.service';
import { DockerRbacGuard, RequireDockerPermission, DockerPermission } from '../guards/docker-rbac.guard';

@ApiTags('Docker Jobs')
@ApiBearerAuth()
@Controller('docker/jobs')
@UseGuards(JwtAuthGuard, DockerRbacGuard)
export class JobsController {
  constructor(private jobsService: JobsService) {}

  @Get()
  @RequireDockerPermission(DockerPermission.VIEWER)
  @ApiOperation({ summary: 'Listar jobs' })
  @ApiQuery({ name: 'type', required: false, enum: ['backup', 'restore', 'pull', 'prune', 'exec'] })
  @ApiQuery({ name: 'status', required: false, enum: ['pending', 'running', 'completed', 'failed'] })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 50 })
  @ApiQuery({ name: 'offset', required: false, type: Number, example: 0 })
  @ApiResponse({ status: 200, description: 'Lista de jobs retornada com sucesso' })
  async getJobs(
    @Request() req: any,
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit?: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset?: number
  ) {
    const filters = {
      type: type as any,
      status: status as any,
      limit,
      offset,
      user_id: req.user.id // Filtrar apenas jobs do usuário atual
    };

    // Remove filtros vazios
    Object.keys(filters).forEach(key => {
      if (!filters[key]) delete filters[key];
    });

    return await this.jobsService.getJobs(filters);
  }

  @Get(':id')
  @RequireDockerPermission(DockerPermission.VIEWER)
  @ApiOperation({ summary: 'Status de job específico' })
  @ApiResponse({ status: 200, description: 'Status do job' })
  @ApiResponse({ status: 404, description: 'Job não encontrado' })
  async getJob(@Param('id') id: string) {
    return await this.jobsService.getJob(id);
  }
}