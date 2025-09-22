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
  HttpStatus
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';
import { NetworksService } from '../services/networks.service';
import { DockerQuotaGuard } from '../guards/docker-quota.guard';
import { DockerRbacGuard, RequireDockerPermission, DockerPermission } from '../guards/docker-rbac.guard';

@ApiTags('Docker Networks')
@ApiBearerAuth()
@Controller('docker/networks')
@UseGuards(JwtAuthGuard, DockerQuotaGuard, DockerRbacGuard)
export class NetworksController {
  constructor(private networksService: NetworksService) {}

  @Get()
  @RequireDockerPermission(DockerPermission.VIEWER)
  @ApiOperation({ summary: 'Listar redes' })
  @ApiQuery({ name: 'driver', required: false, enum: ['bridge', 'host', 'overlay', 'macvlan'] })
  @ApiQuery({ name: 'scope', required: false, enum: ['local', 'global', 'swarm'] })
  @ApiResponse({ status: 200, description: 'Lista de redes retornada com sucesso' })
  async listNetworks(
    @Query('driver') driver?: string,
    @Query('scope') scope?: string
  ) {
    const filters = { driver, scope } as any;

    // Remove filtros vazios
    Object.keys(filters).forEach(key => {
      if (!filters[key]) delete filters[key];
    });

    return await this.networksService.listNetworks(filters);
  }

  @Post()
  @RequireDockerPermission(DockerPermission.OPERATOR)
  @ApiOperation({ summary: 'Criar rede' })
  @ApiResponse({ status: 201, description: 'Rede criada com sucesso' })
  @ApiResponse({ status: 409, description: 'Rede já existe' })
  async createNetwork(
    @Body() createNetworkDto: any,
    @Request() req: any
  ) {
    return await this.networksService.createNetwork(createNetworkDto, req.user);
  }

  @Get(':id')
  @RequireDockerPermission(DockerPermission.VIEWER)
  @ApiOperation({ summary: 'Inspecionar rede' })
  @ApiResponse({ status: 200, description: 'Detalhes da rede' })
  @ApiResponse({ status: 404, description: 'Rede não encontrada' })
  async getNetwork(@Param('id') id: string) {
    return await this.networksService.getNetwork(id);
  }

  @Delete(':id')
  @RequireDockerPermission(DockerPermission.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover rede' })
  @ApiResponse({ status: 204, description: 'Rede removida com sucesso' })
  @ApiResponse({ status: 404, description: 'Rede não encontrada' })
  @ApiResponse({ status: 409, description: 'Rede está em uso' })
  async removeNetwork(
    @Param('id') id: string,
    @Request() req: any
  ) {
    await this.networksService.removeNetwork(id, req.user);
  }

  @Post(':id/connect')
  @RequireDockerPermission(DockerPermission.OPERATOR)
  @ApiOperation({ summary: 'Conectar container à rede' })
  @ApiResponse({ status: 200, description: 'Container conectado com sucesso' })
  async connectContainer(
    @Param('id') id: string,
    @Body() connectDto: any,
    @Request() req: any
  ) {
    return await this.networksService.connectContainer(id, connectDto, req.user);
  }

  @Post(':id/disconnect')
  @RequireDockerPermission(DockerPermission.OPERATOR)
  @ApiOperation({ summary: 'Desconectar container da rede' })
  @ApiResponse({ status: 200, description: 'Container desconectado com sucesso' })
  async disconnectContainer(
    @Param('id') id: string,
    @Body() disconnectDto: any,
    @Request() req: any
  ) {
    return await this.networksService.disconnectContainer(id, disconnectDto, req.user);
  }
}