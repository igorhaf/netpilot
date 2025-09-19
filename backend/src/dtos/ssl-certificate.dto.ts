import { IsString, IsArray, IsBoolean, IsOptional, IsUUID, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSslCertificateDto {
  @ApiProperty({ example: 'exemplo.com' })
  @IsString()
  primaryDomain: string;

  @ApiProperty({ example: ['www.exemplo.com', 'api.exemplo.com'], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  sanDomains?: string[];

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  autoRenew?: boolean;

  @ApiProperty({ example: 30, required: false })
  @IsOptional()
  @IsNumber()
  renewBeforeDays?: number;

  @ApiProperty({ example: 'uuid-do-dominio' })
  @IsUUID()
  domainId: string;
}

export class UpdateSslCertificateDto extends CreateSslCertificateDto {}

export class RenewCertificateDto {
  @ApiProperty({ example: 'uuid-do-certificado' })
  @IsUUID()
  certificateId: string;
}