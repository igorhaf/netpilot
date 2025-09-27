import { IsString, IsOptional, IsArray, IsBoolean } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  technologies?: string[];

  @IsOptional()
  @IsString()
  repository?: string;

  @IsOptional()
  @IsString()
  documentation?: string;

  @IsOptional()
  @IsString()
  aiSessionData?: string;

  @IsOptional()
  @IsString()
  mainDomain?: string;

  @IsOptional()
  metadata?: Record<string, any>;
}