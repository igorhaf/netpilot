import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { PresetsService } from './presets.service';
import { CreatePresetDto } from './dto/create-preset.dto';
import { UpdatePresetDto } from './dto/update-preset.dto';

@ApiTags('Presets')
@ApiBearerAuth()
// @UseGuards(JwtAuthGuard) // Temporarily disabled for testing
@Controller('presets')
export class PresetsController {
  constructor(private readonly presetsService: PresetsService) {}

  @Post()
  @ApiOperation({ summary: 'Criar um novo preset' })
  create(@Body() createPresetDto: CreatePresetDto) {
    return this.presetsService.create(createPresetDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos os presets' })
  findAll(
    @Query('search') search?: string,
    @Query('type') type?: string,
  ) {
    return this.presetsService.findAll(search, type);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Obter estatísticas dos presets' })
  getStatistics() {
    return this.presetsService.getStatistics();
  }

  @Get('stack/:stackId')
  @ApiOperation({ summary: 'Listar presets de uma stack específica' })
  findByStack(@Param('stackId') stackId: string) {
    return this.presetsService.findByStack(stackId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar um preset por ID' })
  findOne(@Param('id') id: string) {
    return this.presetsService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar um preset' })
  update(
    @Param('id') id: string,
    @Body() updatePresetDto: UpdatePresetDto,
  ) {
    return this.presetsService.update(id, updatePresetDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deletar um preset' })
  remove(@Param('id') id: string) {
    return this.presetsService.remove(id);
  }

  @Get('tags/list')
  @ApiOperation({ summary: 'Listar todas as tags únicas' })
  getTags() {
    return this.presetsService.getAllTags();
  }

  @Post('tags')
  @ApiOperation({ summary: 'Adicionar uma nova tag' })
  addTag(@Body('tag') tag: string) {
    return this.presetsService.addTag(tag);
  }

  @Delete('tags/:tag')
  @ApiOperation({ summary: 'Remover uma tag' })
  removeTag(@Param('tag') tag: string) {
    return this.presetsService.removeTag(tag);
  }
}
