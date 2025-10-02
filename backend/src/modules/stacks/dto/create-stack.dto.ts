import { IsString, IsOptional, IsArray, IsBoolean } from 'class-validator';

export class CreateStackDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  technology: string;

  @IsString()
  @IsOptional()
  color?: string;

  @IsString()
  @IsOptional()
  version?: string;

  @IsString()
  @IsOptional()
  author?: string;

  @IsArray()
  @IsOptional()
  tags?: string[];

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
