import { IsString, IsOptional, IsObject, IsNotEmpty, Matches } from 'class-validator';

export class CreateVolumeDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/, {
    message: 'Nome deve conter apenas letras, números, underscore, ponto e hífen'
  })
  name: string;

  @IsString()
  @IsOptional()
  driver?: string = 'local';

  @IsObject()
  @IsOptional()
  driver_opts?: Record<string, string>;

  @IsObject()
  @IsOptional()
  labels?: Record<string, string>;
}