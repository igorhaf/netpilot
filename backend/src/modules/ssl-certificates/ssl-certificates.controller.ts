import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SslCertificatesService } from './ssl-certificates.service';
import { CreateSslCertificateDto, UpdateSslCertificateDto } from '../../dtos/ssl-certificate.dto';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';

@ApiTags('ssl-certificates')
@Controller('ssl-certificates')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SslCertificatesController {
  constructor(private readonly sslCertificatesService: SslCertificatesService) {}

  @Post()
  @ApiOperation({ summary: 'Criar novo certificado SSL' })
  create(@Body() createSslCertificateDto: CreateSslCertificateDto) {
    return this.sslCertificatesService.create(createSslCertificateDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos os certificados SSL' })
  findAll() {
    return this.sslCertificatesService.findAll();
  }

  @Get('stats')
  @ApiOperation({ summary: 'Obter estatísticas dos certificados' })
  getStats() {
    return this.sslCertificatesService.getStats();
  }

  @Post('renew-expired')
  @ApiOperation({ summary: 'Renovar certificados expirados' })
  renewExpired() {
    return this.sslCertificatesService.renewExpiredCertificates();
  }

  @Post(':id/renew')
  @ApiOperation({ summary: 'Renovar certificado específico' })
  renewCertificate(@Param('id') id: string) {
    return this.sslCertificatesService.renewCertificate(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter certificado SSL por ID' })
  findOne(@Param('id') id: string) {
    return this.sslCertificatesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar certificado SSL' })
  update(@Param('id') id: string, @Body() updateSslCertificateDto: UpdateSslCertificateDto) {
    return this.sslCertificatesService.update(id, updateSslCertificateDto);
  }

  @Post(':id/toggle-lock')
  @ApiOperation({ summary: 'Travar/Destravar certificado SSL' })
  toggleLock(@Param('id') id: string) {
    return this.sslCertificatesService.toggleLock(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover certificado SSL' })
  remove(@Param('id') id: string) {
    return this.sslCertificatesService.remove(id);
  }
}