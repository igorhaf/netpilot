import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ParseBoolPipe,
  DefaultValuePipe
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';
import { VolumesService } from '../services/volumes.service';
import { DockerQuotaGuard } from '../guards/docker-quota.guard';
import { DockerRbacGuard, RequireDockerPermission, DockerPermission } from '../guards/docker-rbac.guard';
import { CreateVolumeDto } from '../dto/volumes/create-volume.dto';
import { VolumeBackupDto } from '../dto/volumes/volume-backup.dto';

@ApiTags('Docker Volumes')
@ApiBearerAuth()
@Controller('docker/volumes')
@UseGuards(JwtAuthGuard, DockerQuotaGuard, DockerRbacGuard)
export class VolumesController {
  constructor(private volumesService: VolumesService) {}

  @Get()
  @RequireDockerPermission(DockerPermission.VIEWER)
  @ApiOperation({ summary: 'Listar volumes' })
  @ApiQuery({ name: 'driver', required: false, type: String })
  @ApiQuery({ name: 'dangling', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Lista de volumes retornada com sucesso' })
  async listVolumes(
    @Query('driver') driver?: string,
    @Query('dangling', new DefaultValuePipe(false), ParseBoolPipe) dangling?: boolean
  ) {
    const filters = { driver, dangling };

    // Remove filtros vazios
    Object.keys(filters).forEach(key => {
      if (filters[key] === undefined || filters[key] === null) delete filters[key];
    });

    return await this.volumesService.listVolumes(filters);
  }

  @Post()
  @RequireDockerPermission(DockerPermission.OPERATOR)
  @ApiOperation({ summary: 'Criar volume' })
  @ApiResponse({ status: 201, description: 'Volume criado com sucesso' })
  @ApiResponse({ status: 409, description: 'Volume já existe' })
  async createVolume(
    @Body() createVolumeDto: CreateVolumeDto,
    @Request() req: any
  ) {
    return await this.volumesService.createVolume(createVolumeDto, req.user);
  }

  @Get(':name')
  @RequireDockerPermission(DockerPermission.VIEWER)
  @ApiOperation({ summary: 'Inspecionar volume' })
  @ApiResponse({ status: 200, description: 'Detalhes do volume' })
  @ApiResponse({ status: 404, description: 'Volume não encontrado' })
  async getVolume(@Param('name') name: string) {
    return await this.volumesService.getVolume(name);
  }

  @Delete(':name')
  @RequireDockerPermission(DockerPermission.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover volume' })
  @ApiQuery({ name: 'force', required: false, type: Boolean })
  @ApiResponse({ status: 204, description: 'Volume removido com sucesso' })
  @ApiResponse({ status: 404, description: 'Volume não encontrado' })
  @ApiResponse({ status: 409, description: 'Volume está em uso' })
  async removeVolume(
    @Param('name') name: string,
    @Query('force', new DefaultValuePipe(false), ParseBoolPipe) force: boolean,
    @Request() req: any
  ) {
    await this.volumesService.removeVolume(name, force, req.user);
  }

  @Post(':name/backup')
  @RequireDockerPermission(DockerPermission.OPERATOR)
  @ApiOperation({ summary: 'Criar backup do volume' })
  @ApiResponse({ status: 202, description: 'Backup iniciado' })
  @ApiResponse({ status: 404, description: 'Volume não encontrado' })
  async createVolumeBackup(
    @Param('name') name: string,
    @Body() backupDto: VolumeBackupDto,
    @Request() req: any
  ) {
    return await this.volumesService.createBackup(name, backupDto, req.user);
  }

  @Get(':name/backups')
  @RequireDockerPermission(DockerPermission.VIEWER)
  @ApiOperation({ summary: 'Listar backups do volume' })
  @ApiResponse({ status: 200, description: 'Lista de backups' })
  async getVolumeBackups(@Param('name') name: string) {
    return await this.volumesService.getBackups(name);
  }
}