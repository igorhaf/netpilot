import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Stack } from '../../entities/stack.entity';
import { CreateStackDto } from './dto/create-stack.dto';

@Injectable()
export class StacksService {
  constructor(
    @InjectRepository(Stack)
    private stacksRepository: Repository<Stack>,
  ) {}

  async create(createStackDto: CreateStackDto): Promise<Stack> {
    const stack = this.stacksRepository.create(createStackDto);
    return await this.stacksRepository.save(stack);
  }

  async findAll(search?: string, technology?: string): Promise<Stack[]> {
    const query = this.stacksRepository.createQueryBuilder('stack');

    if (search) {
      query.andWhere(
        '(stack.name ILIKE :search OR stack.description ILIKE :search OR stack.tags::text ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    if (technology) {
      query.andWhere('stack.technology = :technology', { technology });
    }

    return await query.orderBy('stack.createdAt', 'DESC').getMany();
  }

  async findOne(id: string): Promise<Stack> {
    const stack = await this.stacksRepository.findOne({ where: { id } });
    if (!stack) {
      throw new NotFoundException('Stack não encontrada');
    }
    return stack;
  }

  async getTechnologies(): Promise<string[]> {
    const stacks = await this.stacksRepository.find();
    const technologies = [...new Set(stacks.map(s => s.technology))];
    return technologies.sort();
  }

  async remove(id: string): Promise<void> {
    const result = await this.stacksRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Stack não encontrada');
    }
  }
}
