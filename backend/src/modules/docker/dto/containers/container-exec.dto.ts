import { IsArray, IsString, IsBoolean, IsOptional } from 'class-validator';

export class ContainerExecDto {
  @IsArray()
  @IsString({ each: true })
  cmd: string[];

  @IsBoolean()
  @IsOptional()
  interactive?: boolean = false;

  @IsBoolean()
  @IsOptional()
  tty?: boolean = false;

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  env?: string[];
}