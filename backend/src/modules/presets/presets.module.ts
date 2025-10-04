import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Preset } from '../../entities/preset.entity';
import { Stack } from '../../entities/stack.entity';
import { PresetsService } from './presets.service';
import { PresetsController } from './presets.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Preset, Stack])],
  controllers: [PresetsController],
  providers: [PresetsService],
  exports: [PresetsService],
})
export class PresetsModule {}
