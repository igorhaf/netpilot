import { IsString, IsNotEmpty } from 'class-validator';

export class ExecutePromptDto {
  @IsString()
  @IsNotEmpty()
  prompt: string;
}
