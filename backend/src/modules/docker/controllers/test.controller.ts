import { Controller, Get } from '@nestjs/common';

@Controller('api/docker/test')
export class TestController {
  constructor() {
    console.log('🔧 TestController loaded successfully');
  }

  @Get()
  test() {
    console.log('🧪 Test endpoint called');
    return {
      message: 'DockerModule controller routing working',
      timestamp: new Date().toISOString()
    };
  }
}