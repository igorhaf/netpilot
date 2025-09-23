import { IsString, IsNumber, IsBoolean, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProxyRuleDto {
  @ApiProperty({ example: '/api/v1/*' })
  @IsString()
  sourcePath: string;

  @ApiProperty({ example: 80, required: false, description: 'Porta de origem (padrão: 80 para HTTP, 443 para HTTPS)' })
  @IsOptional()
  @IsNumber()
  sourcePort?: number;

  @ApiProperty({ example: 'http://backend:3001' })
  @IsString()
  targetUrl: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  priority: number;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ example: false, required: false, description: 'Trava edição para evitar alterações acidentais' })
  @IsOptional()
  @IsBoolean()
  isLocked?: boolean;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  maintainQueryStrings?: boolean;

  @ApiProperty({ example: 'Proxy para API backend', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'uuid-do-dominio' })
  @IsUUID()
  domainId: string;
}

export class UpdateProxyRuleDto extends CreateProxyRuleDto {}