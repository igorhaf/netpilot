import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';

@Controller('api/docker')
@UseGuards(JwtAuthGuard)
export class DockerMinimalController {

  @Get('containers')
  listContainers() {
    return {
      data: [],
      message: 'Docker containers endpoint working - implementation needed'
    };
  }

  @Get('images')
  listImages() {
    return {
      data: [],
      message: 'Docker images endpoint working - implementation needed'
    };
  }

  @Get('volumes')
  listVolumes() {
    return {
      data: [],
      message: 'Docker volumes endpoint working - implementation needed'
    };
  }

  @Get('networks')
  listNetworks() {
    return {
      data: [],
      message: 'Docker networks endpoint working - implementation needed'
    };
  }

  @Get('jobs')
  listJobs() {
    return {
      data: [],
      message: 'Docker jobs endpoint working - implementation needed'
    };
  }
}