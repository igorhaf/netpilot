import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';

@Controller('projects')
// @UseGuards(JwtAuthGuard) // Temporarily disabled for testing
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  create(@Body() createProjectDto: CreateProjectDto) {
    return this.projectsService.create(createProjectDto);
  }

  @Get()
  findAll(@Query('includeInactive') includeInactive?: string) {
    const includeInactiveFlag = includeInactive === 'true';
    return this.projectsService.findAll(includeInactiveFlag);
  }

  @Get('stats')
  getStats() {
    return this.projectsService.getStats();
  }

  @Get(':id/presets')
  getProjectPresets(@Param('id') id: string) {
    return this.projectsService.getProjectPresets(id);
  }

  @Patch(':id/presets')
  updateProjectPresets(
    @Param('id') id: string,
    @Body() body: { presetIds: string[] }
  ) {
    return this.projectsService.updateProjectPresets(id, body.presetIds);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.projectsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProjectDto: UpdateProjectDto) {
    return this.projectsService.update(id, updateProjectDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.projectsService.remove(id);
  }

  @Post(':id/clone')
  cloneRepository(@Param('id') id: string) {
    return this.projectsService.cloneRepository(id);
  }

  @Post(':id/ssh/generate')
  generateSshKey(@Param('id') id: string) {
    return this.projectsService.generateSshKey(id);
  }

  @Get(':id/ssh/public-key')
  getSshPublicKey(@Param('id') id: string) {
    return this.projectsService.getSshPublicKey(id);
  }

  @Delete(':id/ssh')
  deleteSshKey(@Param('id') id: string) {
    return this.projectsService.deleteSshKey(id);
  }

  @Post(':id/execute-prompt')
  executePrompt(
    @Param('id') id: string,
    @Body() body: { prompt: string },
    @Request() req?: any
  ) {
    const userId = req?.user?.userId;
    return this.projectsService.executePromptRealtime(id, body.prompt, userId);
  }

  @Post(':id/execute-command')
  executeCommand(
    @Param('id') id: string,
    @Body() body: { command: string },
    @Request() req?: any
  ) {
    const userId = req?.user?.userId;
    return this.projectsService.executeCommand(id, body.command, userId);
  }

  @Get(':id/git/status')
  getGitStatus(@Param('id') id: string) {
    return this.projectsService.getGitStatus(id);
  }

  @Post(':id/git/pull')
  gitPull(@Param('id') id: string) {
    return this.projectsService.gitPull(id);
  }

  @Post(':id/git/commit')
  gitCommit(
    @Param('id') id: string,
    @Body() body: { message: string }
  ) {
    return this.projectsService.gitCommit(id, body.message);
  }

  @Post(':id/git/push')
  gitPush(@Param('id') id: string) {
    return this.projectsService.gitPush(id);
  }

  @Get(':id/git/diff')
  getGitDiff(@Param('id') id: string) {
    return this.projectsService.getGitDiff(id);
  }

  @Post(':id/git/generate-commit-message')
  generateCommitMessage(@Param('id') id: string) {
    return this.projectsService.generateCommitMessage(id);
  }
}