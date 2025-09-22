import { Controller, Get } from '@nestjs/common';

@Controller('api/test-simple')
export class TestSimpleController {
  constructor() {
    console.log('🧪 TestSimpleController loaded successfully');
  }

  @Get()
  test() {
    console.log('🚀 TestSimple endpoint called');
    return {
      message: 'TestSimple controller working',
      timestamp: new Date().toISOString()
    };
  }
}