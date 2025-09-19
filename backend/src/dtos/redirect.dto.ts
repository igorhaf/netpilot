import { IsString, IsEnum, IsBoolean, IsOptional, IsUUID, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { RedirectType } from '../entities/redirect.entity';

export class CreateRedirectDto {
  @ApiProperty({ example: '/old-path' })
  @IsString()
  sourcePattern: string;

  @ApiProperty({ example: 'https://exemplo.com/new-path' })
  @IsString()
  targetUrl: string;

  @ApiProperty({ example: RedirectType.PERMANENT, enum: RedirectType })
  @IsEnum(RedirectType)
  type: RedirectType;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @IsNumber()
  priority?: number;

  @ApiProperty({ example: 'Redirecionamento para nova página', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'uuid-do-dominio' })
  @IsUUID()
  domainId: string;
}

export class UpdateRedirectDto extends CreateRedirectDto {}