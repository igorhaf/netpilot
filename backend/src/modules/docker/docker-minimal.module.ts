import { Module } from '@nestjs/common';
import { DockerMinimalController } from './controllers/docker-minimal.controller';

@Module({
  controllers: [DockerMinimalController],
  providers: [],
})
export class DockerMinimalModule {
  constructor() {
    console.log('🐳 DockerMinimalModule loaded successfully');
  }
}