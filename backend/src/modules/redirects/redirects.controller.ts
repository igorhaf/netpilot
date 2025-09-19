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
import { RedirectsService } from './redirects.service';
import { CreateRedirectDto, UpdateRedirectDto } from '../../dtos/redirect.dto';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';

@ApiTags('redirects')
@Controller('redirects')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RedirectsController {
  constructor(private readonly redirectsService: RedirectsService) {}

  @Post()
  @ApiOperation({ summary: 'Criar novo redirect' })
  create(@Body() createRedirectDto: CreateRedirectDto) {
    return this.redirectsService.create(createRedirectDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos os redirects' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'status', required: false })
  findAll(
    @Query('search') search?: string,
    @Query('type') type?: string,
    @Query('status') status?: string,
  ) {
    return this.redirectsService.findAll(search, type, status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter redirect por ID' })
  findOne(@Param('id') id: string) {
    return this.redirectsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar redirect' })
  update(@Param('id') id: string, @Body() updateRedirectDto: UpdateRedirectDto) {
    return this.redirectsService.update(id, updateRedirectDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover redirect' })
  remove(@Param('id') id: string) {
    return this.redirectsService.remove(id);
  }
}