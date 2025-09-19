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
import { ProxyRulesService } from './proxy-rules.service';
import { CreateProxyRuleDto, UpdateProxyRuleDto } from '../../dtos/proxy-rule.dto';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';

@ApiTags('proxy-rules')
@Controller('proxy-rules')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProxyRulesController {
  constructor(private readonly proxyRulesService: ProxyRulesService) {}

  @Post()
  @ApiOperation({ summary: 'Criar nova regra de proxy' })
  create(@Body() createProxyRuleDto: CreateProxyRuleDto) {
    return this.proxyRulesService.create(createProxyRuleDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas as regras de proxy' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'status', required: false })
  findAll(
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    return this.proxyRulesService.findAll(search, status);
  }

  @Post('apply-configuration')
  @ApiOperation({ summary: 'Aplicar configuração das regras de proxy' })
  applyConfiguration() {
    return this.proxyRulesService.applyConfiguration();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter regra de proxy por ID' })
  findOne(@Param('id') id: string) {
    return this.proxyRulesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar regra de proxy' })
  update(@Param('id') id: string, @Body() updateProxyRuleDto: UpdateProxyRuleDto) {
    return this.proxyRulesService.update(id, updateProxyRuleDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover regra de proxy' })
  remove(@Param('id') id: string) {
    return this.proxyRulesService.remove(id);
  }
}