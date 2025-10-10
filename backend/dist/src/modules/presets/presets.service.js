"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PresetsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const preset_entity_1 = require("../../entities/preset.entity");
const stack_entity_1 = require("../../entities/stack.entity");
let PresetsService = class PresetsService {
    constructor(presetRepository, stackRepository) {
        this.presetRepository = presetRepository;
        this.stackRepository = stackRepository;
    }
    async create(createPresetDto) {
        const { stackIds, content, ...presetData } = createPresetDto;
        const existingPreset = await this.presetRepository.findOne({
            where: { name: presetData.name },
        });
        if (existingPreset) {
            throw new common_1.ConflictException('Preset com este nome já existe');
        }
        const size = Buffer.byteLength(content, 'utf8');
        const preset = this.presetRepository.create({
            ...presetData,
            content,
            size,
        });
        if (stackIds && stackIds.length > 0) {
            const stacks = await this.stackRepository.findBy({ id: (0, typeorm_2.In)(stackIds) });
            preset.stacks = stacks;
        }
        return this.presetRepository.save(preset);
    }
    async findAll(search, type) {
        const query = this.presetRepository
            .createQueryBuilder('preset')
            .leftJoinAndSelect('preset.stacks', 'stacks');
        if (search) {
            query.where('preset.name ILIKE :search OR preset.description ILIKE :search', {
                search: `%${search}%`,
            });
        }
        if (type) {
            query.andWhere('preset.type = :type', { type });
        }
        return query
            .orderBy('preset.createdAt', 'DESC')
            .getMany();
    }
    async findOne(id) {
        const preset = await this.presetRepository.findOne({
            where: { id },
            relations: ['stacks'],
        });
        if (!preset) {
            throw new common_1.NotFoundException('Preset não encontrado');
        }
        return preset;
    }
    async update(id, updatePresetDto) {
        const preset = await this.findOne(id);
        const { stackIds, content, ...updateData } = updatePresetDto;
        if (updateData.name && updateData.name !== preset.name) {
            const existingPreset = await this.presetRepository.findOne({
                where: { name: updateData.name },
            });
            if (existingPreset) {
                throw new common_1.ConflictException('Preset com este nome já existe');
            }
        }
        if (content) {
            updateData['content'] = content;
            updateData['size'] = Buffer.byteLength(content, 'utf8');
        }
        Object.assign(preset, updateData);
        if (stackIds) {
            if (stackIds.length > 0) {
                const stacks = await this.stackRepository.findBy({ id: (0, typeorm_2.In)(stackIds) });
                preset.stacks = stacks;
            }
            else {
                preset.stacks = [];
            }
        }
        return this.presetRepository.save(preset);
    }
    async remove(id) {
        const preset = await this.findOne(id);
        await this.presetRepository.remove(preset);
    }
    async findByStack(stackId) {
        return this.presetRepository
            .createQueryBuilder('preset')
            .innerJoin('preset.stacks', 'stack')
            .where('stack.id = :stackId', { stackId })
            .orderBy('preset.createdAt', 'DESC')
            .getMany();
    }
    async getStatistics() {
        const total = await this.presetRepository.count();
        const byType = await this.presetRepository
            .createQueryBuilder('preset')
            .select('preset.type', 'type')
            .addSelect('COUNT(*)', 'count')
            .groupBy('preset.type')
            .getRawMany();
        const totalSize = await this.presetRepository
            .createQueryBuilder('preset')
            .select('SUM(preset.size)', 'totalSize')
            .getRawOne();
        return {
            total,
            byType,
            totalSize: parseInt(totalSize?.totalSize || '0'),
        };
    }
    async getAllTags() {
        const presets = await this.presetRepository.find({
            select: ['tags'],
        });
        const allTags = new Set();
        presets.forEach(preset => {
            if (preset.tags && Array.isArray(preset.tags)) {
                preset.tags.forEach(tag => allTags.add(tag));
            }
        });
        return Array.from(allTags).sort();
    }
    async addTag(tag) {
        return this.getAllTags();
    }
    async removeTag(tag) {
        const presets = await this.presetRepository.find();
        for (const preset of presets) {
            if (preset.tags && preset.tags.includes(tag)) {
                preset.tags = preset.tags.filter(t => t !== tag);
                await this.presetRepository.save(preset);
            }
        }
        return this.getAllTags();
    }
};
exports.PresetsService = PresetsService;
exports.PresetsService = PresetsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(preset_entity_1.Preset)),
    __param(1, (0, typeorm_1.InjectRepository)(stack_entity_1.Stack)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], PresetsService);
//# sourceMappingURL=presets.service.js.map