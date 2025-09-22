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
import { ImagesService } from '../services/images.service';
import { DockerQuotaGuard } from '../guards/docker-quota.guard';
import { DockerRbacGuard, RequireDockerPermission, DockerPermission } from '../guards/docker-rbac.guard';

@ApiTags('Docker Images')
@ApiBearerAuth()
@Controller('docker/images')
@UseGuards(JwtAuthGuard, DockerQuotaGuard, DockerRbacGuard)
export class ImagesController {
  constructor(private imagesService: ImagesService) {}

  @Get()
  @RequireDockerPermission(DockerPermission.VIEWER)
  @ApiOperation({ summary: 'Listar imagens' })
  @ApiQuery({ name: 'dangling', required: false, type: Boolean })
  @ApiQuery({ name: 'reference', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Lista de imagens retornada com sucesso' })
  async listImages(
    @Query('dangling', new DefaultValuePipe(false), ParseBoolPipe) dangling?: boolean,
    @Query('reference') reference?: string
  ) {
    const filters = { dangling, reference };

    // Remove filtros vazios
    Object.keys(filters).forEach(key => {
      if (filters[key] === undefined || filters[key] === null) delete filters[key];
    });

    return await this.imagesService.listImages(filters);
  }

  @Post('pull')
  @RequireDockerPermission(DockerPermission.OPERATOR)
  @ApiOperation({ summary: 'Fazer pull de imagem' })
  @ApiResponse({ status: 202, description: 'Pull iniciado' })
  @ApiResponse({ status: 404, description: 'Imagem não encontrada no registry' })
  async pullImage(
    @Body() pullDto: { reference: string; auth?: any },
    @Request() req: any
  ) {
    return await this.imagesService.pullImage(pullDto.reference, pullDto.auth, req.user);
  }

  @Get(':id')
  @RequireDockerPermission(DockerPermission.VIEWER)
  @ApiOperation({ summary: 'Inspecionar imagem' })
  @ApiResponse({ status: 200, description: 'Detalhes da imagem' })
  @ApiResponse({ status: 404, description: 'Imagem não encontrada' })
  async getImage(@Param('id') id: string) {
    return await this.imagesService.getImage(id);
  }

  @Delete(':id')
  @RequireDockerPermission(DockerPermission.ADMIN)
  @ApiOperation({ summary: 'Remover imagem' })
  @ApiQuery({ name: 'force', required: false, type: Boolean })
  @ApiQuery({ name: 'noprune', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Imagem removida com sucesso' })
  @ApiResponse({ status: 404, description: 'Imagem não encontrada' })
  @ApiResponse({ status: 409, description: 'Imagem está sendo usada por containers' })
  async removeImage(
    @Param('id') id: string,
    @Request() req: any,
    @Query('force', new DefaultValuePipe(false), ParseBoolPipe) force?: boolean,
    @Query('noprune', new DefaultValuePipe(false), ParseBoolPipe) noprune?: boolean
  ) {
    return await this.imagesService.removeImage(id, force, noprune, req.user);
  }

  @Post('prune')
  @RequireDockerPermission(DockerPermission.ADMIN)
  @ApiOperation({ summary: 'Limpar imagens não utilizadas' })
  @ApiResponse({ status: 202, description: 'Limpeza iniciada' })
  async pruneImages(
    @Body() pruneDto: {
      dry_run?: boolean;
      dangling_only?: boolean;
      until?: string
    },
    @Request() req: any
  ) {
    return await this.imagesService.pruneImages(pruneDto, req.user);
  }
}