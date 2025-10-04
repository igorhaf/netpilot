import { IsOptional, IsEnum, IsDateString, IsString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ExecutionStatus, TriggerType } from '../../../entities/job-execution.entity';

export class JobExecutionQueryDto {
  @IsOptional()
  @IsString()
  jobQueueId?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsEnum(TriggerType)
  triggerType?: TriggerType;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number = 10;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  projectId?: string;
}