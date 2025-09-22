import { Module } from '@nestjs/common';
import { TestController } from './controllers/test.controller';

@Module({
  controllers: [TestController],
  providers: [],
})
export class DockerSimpleModule {
  constructor() {
    console.log('🐳 DockerSimpleModule loaded successfully');
  }
}