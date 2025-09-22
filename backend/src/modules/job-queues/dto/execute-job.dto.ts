import { IsOptional, IsObject, IsEnum } from 'class-validator';
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
}