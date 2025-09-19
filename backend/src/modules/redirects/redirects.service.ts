import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Redirect } from '../../entities/redirect.entity';
import { CreateRedirectDto, UpdateRedirectDto } from '../../dtos/redirect.dto';
import { ConfigGenerationService } from '../../services/config-generation.service';

@Injectable()
export class RedirectsService {
  constructor(
    @InjectRepository(Redirect)
    private redirectRepository: Repository<Redirect>,
    private configGenerationService: ConfigGenerationService,
  ) {}

  async create(createRedirectDto: CreateRedirectDto): Promise<Redirect> {
    const redirect = this.redirectRepository.create(createRedirectDto);
    const saved = await this.redirectRepository.save(redirect);

    await this.configGenerationService.generateNginxConfig();
    await this.configGenerationService.generateTraefikConfig();

    return this.findOne(saved.id);
  }

  async findAll(search?: string, type?: string, status?: string): Promise<Redirect[]> {
    const query = this.redirectRepository.createQueryBuilder('redirect')
      .leftJoinAndSelect('redirect.domain', 'domain');

    if (search) {
      query.where(
        'redirect.sourcePattern ILIKE :search OR redirect.targetUrl ILIKE :search OR domain.name ILIKE :search',
        { search: `%${search}%` }
      );
    }

    if (type) {
      query.andWhere('redirect.type = :type', { type });
    }

    if (status) {
      query.andWhere('redirect.isActive = :isActive', {
        isActive: status === 'active',
      });
    }

    return query.orderBy('redirect.priority', 'DESC')
      .addOrderBy('redirect.createdAt', 'DESC')
      .getMany();
  }

  async findOne(id: string): Promise<Redirect> {
    const redirect = await this.redirectRepository.findOne({
      where: { id },
      relations: ['domain'],
    });

    if (!redirect) {
      throw new NotFoundException('Redirect não encontrado');
    }

    return redirect;
  }

  async update(id: string, updateRedirectDto: UpdateRedirectDto): Promise<Redirect> {
    const redirect = await this.findOne(id);
    Object.assign(redirect, updateRedirectDto);
    await this.redirectRepository.save(redirect);

    await this.configGenerationService.generateNginxConfig();
    await this.configGenerationService.generateTraefikConfig();

    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const redirect = await this.findOne(id);
    await this.redirectRepository.remove(redirect);

    await this.configGenerationService.generateNginxConfig();
    await this.configGenerationService.generateTraefikConfig();
  }
}