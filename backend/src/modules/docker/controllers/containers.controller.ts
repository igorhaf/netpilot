import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  Request,
  HttpCode,
  HttpStatus,
  ParseBoolPipe,
  DefaultValuePipe,
  ParseIntPipe
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';
import { ContainersService } from '../services/containers.service';
import { DockerQuotaGuard } from '../guards/docker-quota.guard';
import { CreateContainerDto } from '../dto/containers/create-container.dto';
import { ContainerActionDto } from '../dto/containers/container-action.dto';
import { ContainerExecDto } from '../dto/containers/container-exec.dto';

@ApiTags('Docker Containers')
@ApiBearerAuth()
@Controller('docker/containers')
@UseGuards(JwtAuthGuard, DockerQuotaGuard)
export class ContainersController {
  constructor(private containersService: ContainersService) {}

  @Get()
  @ApiOperation({ summary: 'Listar containers' })
  @ApiQuery({ name: 'status', required: false, enum: ['running', 'exited', 'paused', 'created', 'restarting', 'removing', 'dead'] })
  @ApiQuery({ name: 'image', required: false, type: String })
  @ApiQuery({ name: 'name', required: false, type: String })
  @ApiQuery({ name: 'label', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 50 })
  @ApiResponse({ status: 200, description: 'Lista de containers retornada com sucesso' })
  async listContainers(
    @Query('status') status?: string,
    @Query('image') image?: string,
    @Query('name') name?: string,
    @Query('label') label?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit?: number
  ) {
    const filters = { status, image, name, label } as any;

    // Remove filtros vazios
    Object.keys(filters).forEach(key => {
      if (!filters[key]) delete filters[key];
    });

    const result = await this.containersService.listContainers(filters);

    // Implementar paginação simples
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedData = result.data.slice(startIndex, endIndex);

    return {
      data: paginatedData,
      pagination: {
        page,
        limit,
        total: result.total,
        pages: Math.ceil(result.total / limit)
      }
    };
  }

  @Post()
  @ApiOperation({ summary: 'Criar container' })
  @ApiResponse({ status: 201, description: 'Container criado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 404, description: 'Imagem não encontrada' })
  @ApiResponse({ status: 409, description: 'Nome do container já existe' })
  async createContainer(
    @Body() createContainerDto: CreateContainerDto,
    @Request() req: any
  ) {
    return await this.containersService.createContainer(createContainerDto, req.user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Inspecionar container' })
  @ApiResponse({ status: 200, description: 'Detalhes do container' })
  @ApiResponse({ status: 404, description: 'Container não encontrado' })
  async getContainer(@Param('id') id: string) {
    return await this.containersService.getContainer(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover container' })
  @ApiQuery({ name: 'force', required: false, type: Boolean })
  @ApiResponse({ status: 204, description: 'Container removido com sucesso' })
  @ApiResponse({ status: 404, description: 'Container não encontrado' })
  @ApiResponse({ status: 409, description: 'Container está rodando e não pode ser removido' })
  async removeContainer(
    @Param('id') id: string,
    @Query('force', new DefaultValuePipe(false), ParseBoolPipe) force: boolean,
    @Request() req: any
  ) {
    await this.containersService.removeContainer(id, force, req.user);
  }

  @Post(':id/actions/:action')
  @ApiOperation({ summary: 'Executar ação no container' })
  @ApiResponse({ status: 200, description: 'Ação executada com sucesso' })
  @ApiResponse({ status: 404, description: 'Container não encontrado' })
  @ApiResponse({ status: 409, description: 'Ação não pode ser executada no estado atual' })
  async containerAction(
    @Param('id') id: string,
    @Param('action') action: string,
    @Body() actionDto: ContainerActionDto,
    @Request() req: any
  ) {
    await this.containersService.containerAction(id, action as any, actionDto, req.user);

    return {
      message: `Container ${action} executado com sucesso`,
      status: 'success'
    };
  }

  @Get(':id/logs')
  @ApiOperation({ summary: 'Obter logs do container' })
  @ApiQuery({ name: 'tail', required: false, type: Number, example: 100 })
  @ApiQuery({ name: 'since', required: false, type: String, description: 'ISO datetime' })
  @ApiQuery({ name: 'until', required: false, type: String, description: 'ISO datetime' })
  @ApiQuery({ name: 'follow', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Logs do container' })
  @ApiResponse({ status: 404, description: 'Container não encontrado' })
  async getContainerLogs(
    @Param('id') id: string,
    @Query('tail', new DefaultValuePipe(100), ParseIntPipe) tail?: number,
    @Query('since') since?: string,
    @Query('until') until?: string,
    @Query('follow', new DefaultValuePipe(false), ParseBoolPipe) follow?: boolean
  ) {
    const options = {
      tail,
      since: since ? new Date(since) : undefined,
      until: until ? new Date(until) : undefined,
      follow
    };

    const logs = await this.containersService.getContainerLogs(id, options);

    const response: any = { logs };

    if (follow) {
      response.websocket_url = `/ws/docker/containers/${id}/logs`;
    }

    return response;
  }

  @Post(':id/exec')
  @ApiOperation({ summary: 'Executar comando no container' })
  @ApiResponse({ status: 200, description: 'Comando executado' })
  @ApiResponse({ status: 404, description: 'Container não encontrado' })
  async execContainer(
    @Param('id') id: string,
    @Body() execDto: ContainerExecDto,
    @Request() req: any
  ) {
    return await this.containersService.createExecSession(id, execDto.cmd, {
      interactive: execDto.interactive,
      tty: execDto.tty,
      env: execDto.env
    }, req.user);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Estatísticas do container' })
  @ApiQuery({ name: 'stream', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Estatísticas do container' })
  @ApiResponse({ status: 404, description: 'Container não encontrado' })
  async getContainerStats(
    @Param('id') id: string,
    @Query('stream', new DefaultValuePipe(false), ParseBoolPipe) stream?: boolean
  ) {
    if (stream) {
      return {
        websocket_url: `/ws/docker/containers/${id}/stats`
      };
    }

    return await this.containersService.getContainerStats(id);
  }
}