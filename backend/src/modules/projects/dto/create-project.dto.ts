import { IsString, IsOptional, IsArray, IsBoolean, Matches, IsEnum } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  name: string;

  @IsString()
  @Matches(/^[a-z0-9]+(-[a-z0-9]+)*$/, {
    message: 'Apelido deve conter apenas letras minúsculas, números e hifens. Não pode começar ou terminar com hífen.'
  })
  alias: string;

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

  @IsString()
  repository: string;

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
  @IsString()
  defaultPromptTemplate?: string;

  @IsOptional()
  @IsEnum(['realtime', 'queue'])
  executionMode?: 'realtime' | 'queue';

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  stackIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  presetIds?: string[];

  @IsOptional()
  metadata?: Record<string, any>;
}