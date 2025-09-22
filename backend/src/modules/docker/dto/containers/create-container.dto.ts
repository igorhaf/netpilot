import { IsString, IsArray, IsOptional, IsObject, IsEnum, IsBoolean, ValidateNested, IsNotEmpty, Matches } from 'class-validator';
import { Type } from 'class-transformer';

class VolumeMount {
  @IsString()
  source: string;

  @IsString()
  target: string;

  @IsEnum(['bind', 'volume'])
  type: 'bind' | 'volume';

  @IsBoolean()
  @IsOptional()
  readonly?: boolean;
}

class PortBinding {
  @IsString()
  HostPort: string;
}

export class CreateContainerDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/, {
    message: 'Nome deve conter apenas letras, números, underscore, ponto e hífen'
  })
  name: string;

  @IsString()
  @IsNotEmpty()
  image: string;

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  env?: string[];

  @IsObject()
  @IsOptional()
  ports?: Record<string, PortBinding[]>;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => VolumeMount)
  volumes?: VolumeMount[];

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  networks?: string[];

  @IsEnum(['no', 'always', 'unless-stopped', 'on-failure'])
  @IsOptional()
  restart_policy?: 'no' | 'always' | 'unless-stopped' | 'on-failure' = 'no';

  @IsObject()
  @IsOptional()
  labels?: Record<string, string>;

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  command?: string[];
}