import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StacksController } from './stacks.controller';
import { StacksService } from './stacks.service';
import { Stack } from '../../entities/stack.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Stack])],
  controllers: [StacksController],
  providers: [StacksService],
  exports: [StacksService],
})
export class StacksModule {}
