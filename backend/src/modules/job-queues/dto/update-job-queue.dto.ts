import { PartialType } from '@nestjs/mapped-types';
import { CreateJobQueueDto } from './create-job-queue.dto';

export class UpdateJobQueueDto extends PartialType(CreateJobQueueDto) {}