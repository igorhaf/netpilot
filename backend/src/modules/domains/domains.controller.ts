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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DomainsService } from './domains.service';
import { CreateDomainDto, UpdateDomainDto } from '../../dtos/domain.dto';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';

@ApiTags('domains')
@Controller('domains')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DomainsController {
  constructor(private readonly domainsService: DomainsService) {}

  @Post()
  @ApiOperation({ summary: 'Criar novo domínio' })
  create(@Body() createDomainDto: CreateDomainDto) {
    return this.domainsService.create(createDomainDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos os domínios' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'autoTls', required: false })
  findAll(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('autoTls') autoTls?: string,
  ) {
    return this.domainsService.findAll(search, status, autoTls);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Obter estatísticas dos domínios' })
  getStats() {
    return this.domainsService.getStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter domínio por ID' })
  findOne(@Param('id') id: string) {
    return this.domainsService.findOne(id);
  }

  @Patch(':id/toggle-lock')
  @ApiOperation({ summary: 'Travar/destravar domínio' })
  toggleLock(@Param('id') id: string) {
    return this.domainsService.toggleLock(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar domínio' })
  update(@Param('id') id: string, @Body() updateDomainDto: UpdateDomainDto) {
    return this.domainsService.update(id, updateDomainDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover domínio' })
  remove(@Param('id') id: string) {
    return this.domainsService.remove(id);
  }
}