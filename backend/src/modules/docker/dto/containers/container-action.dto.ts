import { IsOptional, IsString, IsInt, Min, Max } from 'class-validator';

export class ContainerActionDto {
  @IsOptional()
  @IsString()
  signal?: string; // Para kill (SIGTERM, SIGKILL, etc)

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(300)
  timeout?: number; // Para stop (em segundos)
}