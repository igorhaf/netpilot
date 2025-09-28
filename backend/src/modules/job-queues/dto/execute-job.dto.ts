import { IsOptional, IsObject, IsEnum, IsNumber, Min } from 'class-validator';
import { TriggerType } from '../../../entities/job-execution.entity';

export class ExecuteJobDto {
  @IsOptional()
  @IsEnum(TriggerType)
  triggerType?: TriggerType;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsObject()
  environmentVars?: Record<string, string>;

  @IsOptional()
  @IsNumber()
  @Min(0)
  delay?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  priority?: number;
}