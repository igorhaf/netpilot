import { PresetsService } from './presets.service';
import { CreatePresetDto } from './dto/create-preset.dto';
import { UpdatePresetDto } from './dto/update-preset.dto';
export declare class PresetsController {
    private readonly presetsService;
    constructor(presetsService: PresetsService);
    create(createPresetDto: CreatePresetDto): Promise<import("../../entities/preset.entity").Preset>;
    findAll(search?: string, type?: string): Promise<import("../../entities/preset.entity").Preset[]>;
    getStatistics(): Promise<any>;
    findByStack(stackId: string): Promise<import("../../entities/preset.entity").Preset[]>;
    findOne(id: string): Promise<import("../../entities/preset.entity").Preset>;
    update(id: string, updatePresetDto: UpdatePresetDto): Promise<import("../../entities/preset.entity").Preset>;
    remove(id: string): Promise<void>;
    getTags(): Promise<string[]>;
    addTag(tag: string): Promise<string[]>;
    removeTag(tag: string): Promise<string[]>;
}
