import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Preset } from '../../entities/preset.entity';
import { Stack } from '../../entities/stack.entity';
import { CreatePresetDto } from './dto/create-preset.dto';
import { UpdatePresetDto } from './dto/update-preset.dto';

@Injectable()
export class PresetsService {
  constructor(
    @InjectRepository(Preset)
    private presetRepository: Repository<Preset>,
    @InjectRepository(Stack)
    private stackRepository: Repository<Stack>,
  ) {}

  async create(createPresetDto: CreatePresetDto): Promise<Preset> {
    const { stackIds, content, ...presetData } = createPresetDto;

    // Verificar se já existe preset com mesmo nome
    const existingPreset = await this.presetRepository.findOne({
      where: { name: presetData.name },
    });

    if (existingPreset) {
      throw new ConflictException('Preset com este nome já existe');
    }

    // Calcular tamanho do conteúdo
    const size = Buffer.byteLength(content, 'utf8');

    // Criar preset
    const preset = this.presetRepository.create({
      ...presetData,
      content,
      size,
    });

    // Se tiver stackIds, associar às stacks
    if (stackIds && stackIds.length > 0) {
      const stacks = await this.stackRepository.findBy({ id: In(stackIds) });
      preset.stacks = stacks;
    }

    return this.presetRepository.save(preset);
  }

  async findAll(search?: string, type?: string): Promise<Preset[]> {
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

  async findOne(id: string): Promise<Preset> {
    const preset = await this.presetRepository.findOne({
      where: { id },
      relations: ['stacks'],
    });

    if (!preset) {
      throw new NotFoundException('Preset não encontrado');
    }

    return preset;
  }

  async update(id: string, updatePresetDto: UpdatePresetDto): Promise<Preset> {
    const preset = await this.findOne(id);
    const { stackIds, content, ...updateData } = updatePresetDto;

    // Verificar nome único se mudou
    if (updateData.name && updateData.name !== preset.name) {
      const existingPreset = await this.presetRepository.findOne({
        where: { name: updateData.name },
      });

      if (existingPreset) {
        throw new ConflictException('Preset com este nome já existe');
      }
    }

    // Atualizar tamanho se conteúdo foi alterado
    if (content) {
      updateData['content'] = content;
      updateData['size'] = Buffer.byteLength(content, 'utf8');
    }

    Object.assign(preset, updateData);

    // Atualizar stacks se fornecido
    if (stackIds) {
      if (stackIds.length > 0) {
        const stacks = await this.stackRepository.findBy({ id: In(stackIds) });
        preset.stacks = stacks;
      } else {
        preset.stacks = [];
      }
    }

    return this.presetRepository.save(preset);
  }

  async remove(id: string): Promise<void> {
    const preset = await this.findOne(id);
    await this.presetRepository.remove(preset);
  }

  async findByStack(stackId: string): Promise<Preset[]> {
    return this.presetRepository
      .createQueryBuilder('preset')
      .innerJoin('preset.stacks', 'stack')
      .where('stack.id = :stackId', { stackId })
      .orderBy('preset.createdAt', 'DESC')
      .getMany();
  }

  async getStatistics(): Promise<any> {
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

  async getAllTags(): Promise<string[]> {
    const presets = await this.presetRepository.find({
      select: ['tags'],
    });

    const allTags = new Set<string>();
    presets.forEach(preset => {
      if (preset.tags && Array.isArray(preset.tags)) {
        preset.tags.forEach(tag => allTags.add(tag));
      }
    });

    return Array.from(allTags).sort();
  }

  async addTag(tag: string): Promise<string[]> {
    // Tag é adicionada quando usada em um preset
    // Aqui apenas retornamos as tags existentes
    return this.getAllTags();
  }

  async removeTag(tag: string): Promise<string[]> {
    // Remove a tag de todos os presets que a contém
    const presets = await this.presetRepository.find();

    for (const preset of presets) {
      if (preset.tags && preset.tags.includes(tag)) {
        preset.tags = preset.tags.filter(t => t !== tag);
        await this.presetRepository.save(preset);
      }
    }

    return this.getAllTags();
  }
}
