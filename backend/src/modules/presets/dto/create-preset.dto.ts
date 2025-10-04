import { IsString, IsNotEmpty, IsEnum, IsOptional, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePresetDto {
  @ApiProperty({ description: 'Nome do preset' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Descrição do preset', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Tipo do preset', enum: ['docker', 'persona', 'template', 'script', 'config'] })
  @IsEnum(['docker', 'persona', 'template', 'script', 'config'])
  @IsNotEmpty()
  type: 'docker' | 'persona' | 'template' | 'script' | 'config';

  @ApiProperty({ description: 'Conteúdo do preset' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ description: 'Linguagem de programação', required: false })
  @IsString()
  @IsOptional()
  language?: string;

  @ApiProperty({ description: 'Nome do arquivo', required: false })
  @IsString()
  @IsOptional()
  filename?: string;

  @ApiProperty({ description: 'Tags do preset', type: [String], default: [] })
  @IsArray()
  @IsOptional()
  tags?: string[];

  @ApiProperty({ description: 'IDs das stacks associadas', type: [String], default: [] })
  @IsArray()
  @IsOptional()
  stackIds?: string[];
}
