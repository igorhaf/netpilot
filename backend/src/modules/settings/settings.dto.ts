import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class SaveAiSettingsDto {
  @IsString()
  @IsOptional()
  prompts?: string;

  @IsString()
  @IsOptional()
  commits?: string;

  @IsString()
  @IsOptional()
  promptImprovement?: string;

  @IsString()
  @IsOptional()
  translation?: string;

  @IsString()
  @IsOptional()
  commands?: string;
}

export class SaveTerminalSettingsDto {
  @IsString()
  @IsOptional()
  defaultShell?: string;

  @IsString()
  @IsOptional()
  workingDirectory?: string;
}

export class SettingDto {
  @IsString()
  key: string;

  @IsString()
  @IsOptional()
  value?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  description?: string;
}
