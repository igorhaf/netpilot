import { IsString, IsBoolean, IsOptional, IsIP } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDomainDto {
  @ApiProperty({ example: 'exemplo.com' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Meu site principal', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  autoTls?: boolean;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  forceHttps?: boolean;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  blockExternalAccess?: boolean;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  enableWwwRedirect?: boolean;

  @ApiProperty({ example: '127.0.0.1', required: false })
  @IsOptional()
  @IsIP()
  bindIp?: string;
}

export class UpdateDomainDto extends CreateDomainDto {}