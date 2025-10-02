import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { StacksService } from './stacks.service';
import { CreateStackDto } from './dto/create-stack.dto';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';

@Controller('stacks')
@UseGuards(JwtAuthGuard)
export class StacksController {
  constructor(private readonly stacksService: StacksService) {}

  @Post()
  create(@Body() createStackDto: CreateStackDto) {
    return this.stacksService.create(createStackDto);
  }

  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('technology') technology?: string,
  ) {
    return this.stacksService.findAll(search, technology);
  }

  @Get('technologies')
  getTechnologies() {
    return this.stacksService.getTechnologies();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.stacksService.findOne(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.stacksService.remove(id);
  }
}
