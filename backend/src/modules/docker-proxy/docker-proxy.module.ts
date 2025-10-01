import { Module } from '@nestjs/common';
import { DockerProxyController } from './docker-proxy.controller';

@Module({
  controllers: [DockerProxyController],
})
export class DockerProxyModule {}