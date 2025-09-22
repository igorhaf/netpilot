import { IsString, IsOptional, IsBoolean, IsNumber, IsEnum, IsObject } from 'class-validator';
import { ScriptType } from '../../../entities/job-queue.entity';

export class CreateJobQueueDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  scriptPath: string;

  @IsEnum(ScriptType)
  scriptType: ScriptType;

  @IsOptional()
  @IsString()
  cronExpression?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsNumber()
  priority?: number;

  @IsOptional()
  @IsNumber()
  maxRetries?: number;

  @IsOptional()
  @IsNumber()
  timeoutSeconds?: number;

  @IsOptional()
  @IsObject()
  environmentVars?: Record<string, string>;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}