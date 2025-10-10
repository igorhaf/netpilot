import { Repository } from 'typeorm';
import { Preset } from '../../entities/preset.entity';
import { Stack } from '../../entities/stack.entity';
import { CreatePresetDto } from './dto/create-preset.dto';
import { UpdatePresetDto } from './dto/update-preset.dto';
export declare class PresetsService {
    private presetRepository;
    private stackRepository;
    constructor(presetRepository: Repository<Preset>, stackRepository: Repository<Stack>);
    create(createPresetDto: CreatePresetDto): Promise<Preset>;
    findAll(search?: string, type?: string): Promise<Preset[]>;
    findOne(id: string): Promise<Preset>;
    update(id: string, updatePresetDto: UpdatePresetDto): Promise<Preset>;
    remove(id: string): Promise<void>;
    findByStack(stackId: string): Promise<Preset[]>;
    getStatistics(): Promise<any>;
    getAllTags(): Promise<string[]>;
    addTag(tag: string): Promise<string[]>;
    removeTag(tag: string): Promise<string[]>;
}
