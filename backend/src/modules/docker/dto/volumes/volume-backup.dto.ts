import { IsString, IsArray, IsOptional, MaxLength, IsNotEmpty, IsBoolean } from 'class-validator';

export class VolumeBackupDto {
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  @MaxLength(50, { each: true })
  tags?: string[];
}

export class VolumeRestoreDto {
  @IsString()
  @IsNotEmpty()
  backup_id: string;

  @IsBoolean()
  @IsOptional()
  force?: boolean = false;
}