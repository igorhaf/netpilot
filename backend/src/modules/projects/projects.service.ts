import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import { Project } from '../../entities/project.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

const execAsync = promisify(exec);

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
  ) {}

  async create(createProjectDto: CreateProjectDto): Promise<Project> {
    // Verificar se já existe um projeto com o mesmo nome
    const existingProject = await this.projectRepository.findOne({
      where: { name: createProjectDto.name },
    });

    if (existingProject) {
      throw new ConflictException('Projeto com este nome já existe');
    }

    // Verificar se já existe um projeto com o mesmo alias
    const existingAlias = await this.projectRepository.findOne({
      where: { alias: createProjectDto.alias },
    });

    if (existingAlias) {
      throw new ConflictException('Projeto com este alias já existe');
    }

    // Definir caminho do projeto
    const projectsRoot = process.env.PROJECTS_ROOT || '/home/projects';
    const projectPath = path.join(projectsRoot, createProjectDto.alias);

    // Verificar se a pasta já existe
    try {
      await fs.access(projectPath);
      throw new ConflictException(`Pasta do projeto já existe: ${projectPath}`);
    } catch (error) {
      // Pasta não existe, pode prosseguir
    }

    // Criar o projeto no banco primeiro
    const project = this.projectRepository.create(createProjectDto);
    const savedProject = await this.projectRepository.save(project);

    try {
      // Criar diretório do projeto
      await fs.mkdir(projectPath, { recursive: true });
      console.log(`✅ Pasta do projeto criada: ${projectPath}`);

      // Clonar repositório
      console.log(`🔄 Clonando repositório: ${createProjectDto.repository}`);
      const { stdout, stderr } = await execAsync(
        `git clone "${createProjectDto.repository}" "${projectPath}"`,
        { timeout: 60000 } // 1 minuto timeout
      );

      if (stderr && !stderr.includes('Cloning into')) {
        console.warn(`⚠️ Warning during clone: ${stderr}`);
      }

      console.log(`✅ Repositório clonado com sucesso para: ${projectPath}`);
      console.log(`📋 Output: ${stdout}`);

      // Atualizar projeto com o caminho (manual por enquanto)
      try {
        await this.projectRepository.update(savedProject.id, {
          description: `${savedProject.description} | Pasta: ${projectPath}`
        });
        console.log(`📁 Caminho do projeto registrado: ${projectPath}`);
      } catch (pathError) {
        console.warn(`⚠️ Falha ao registrar caminho: ${pathError.message}`);
      }

    } catch (error) {
      // Se falhou, limpar o projeto criado
      console.error(`❌ Erro ao criar pasta/clonar repositório: ${error.message}`);

      // Tentar remover pasta se foi criada
      try {
        await fs.rmdir(projectPath, { recursive: true });
      } catch (cleanupError) {
        console.warn(`⚠️ Falha ao limpar pasta: ${cleanupError.message}`);
      }

      // Remover projeto do banco
      await this.projectRepository.remove(savedProject);

      throw new ConflictException(
        `Falha ao criar projeto: ${error.message}. Verifique se o repositório é válido e acessível.`
      );
    }

    return savedProject;
  }

  async findAll(includeInactive = false): Promise<Project[]> {
    const queryBuilder = this.projectRepository
      .createQueryBuilder('project')
      .leftJoinAndSelect('project.domains', 'domains')
      .leftJoinAndSelect('domains.proxyRules', 'proxyRules')
      .leftJoinAndSelect('domains.sslCertificates', 'sslCertificates');

    if (!includeInactive) {
      queryBuilder.where('project.isActive = :isActive', { isActive: true });
    }

    return await queryBuilder
      .orderBy('project.createdAt', 'DESC')
      .getMany();
  }

  async findOne(id: string): Promise<Project> {
    const project = await this.projectRepository
      .createQueryBuilder('project')
      .leftJoinAndSelect('project.domains', 'domains')
      .leftJoinAndSelect('domains.proxyRules', 'proxyRules')
      .leftJoinAndSelect('domains.sslCertificates', 'sslCertificates')
      .where('project.id = :id', { id })
      .getOne();

    if (!project) {
      throw new NotFoundException('Projeto não encontrado');
    }

    return project;
  }

  async update(id: string, updateProjectDto: UpdateProjectDto): Promise<Project> {
    const project = await this.findOne(id);

    // Verificar conflito de nome se o nome for alterado
    if (updateProjectDto.name && updateProjectDto.name !== project.name) {
      const existingProject = await this.projectRepository.findOne({
        where: { name: updateProjectDto.name },
      });

      if (existingProject) {
        throw new ConflictException('Projeto com este nome já existe');
      }
    }

    Object.assign(project, updateProjectDto);
    return await this.projectRepository.save(project);
  }

  async remove(id: string): Promise<void> {
    const project = await this.findOne(id);

    // Verificar se tem domínios associados
    if (project.domains && project.domains.length > 0) {
      throw new ConflictException(
        'Não é possível excluir projeto que possui domínios associados. ' +
        'Remova ou transfira os domínios primeiro.'
      );
    }

    await this.projectRepository.remove(project);
  }

  async getStats(): Promise<any> {
    const total = await this.projectRepository.count();
    const active = await this.projectRepository.count({ where: { isActive: true } });
    const inactive = total - active;

    const projectsWithDomains = await this.projectRepository
      .createQueryBuilder('project')
      .leftJoin('project.domains', 'domains')
      .select('project.id')
      .addSelect('COUNT(domains.id)', 'domainCount')
      .groupBy('project.id')
      .getRawMany();

    const totalDomains = projectsWithDomains.reduce(
      (sum, project) => sum + parseInt(project.domainCount || 0),
      0
    );

    return {
      total,
      active,
      inactive,
      totalDomains,
      avgDomainsPerProject: total > 0 ? Math.round(totalDomains / total * 100) / 100 : 0,
    };
  }
}