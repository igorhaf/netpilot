import { IsString, IsNumber, IsBoolean, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProxyRuleDto {
  @ApiProperty({ example: '/api/v1/*' })
  @IsString()
  sourcePath: string;

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