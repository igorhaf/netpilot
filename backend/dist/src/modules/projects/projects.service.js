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
exports.ProjectsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const project_entity_1 = require("../../entities/project.entity");
let ProjectsService = class ProjectsService {
    constructor(projectRepository) {
        this.projectRepository = projectRepository;
    }
    async create(createProjectDto) {
        const existingProject = await this.projectRepository.findOne({
            where: { name: createProjectDto.name },
        });
        if (existingProject) {
            throw new common_1.ConflictException('Projeto com este nome já existe');
        }
        const project = this.projectRepository.create(createProjectDto);
        return await this.projectRepository.save(project);
    }
    async findAll(includeInactive = false) {
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
    async findOne(id) {
        const project = await this.projectRepository
            .createQueryBuilder('project')
            .leftJoinAndSelect('project.domains', 'domains')
            .leftJoinAndSelect('domains.proxyRules', 'proxyRules')
            .leftJoinAndSelect('domains.sslCertificates', 'sslCertificates')
            .where('project.id = :id', { id })
            .getOne();
        if (!project) {
            throw new common_1.NotFoundException('Projeto não encontrado');
        }
        return project;
    }
    async update(id, updateProjectDto) {
        const project = await this.findOne(id);
        if (updateProjectDto.name && updateProjectDto.name !== project.name) {
            const existingProject = await this.projectRepository.findOne({
                where: { name: updateProjectDto.name },
            });
            if (existingProject) {
                throw new common_1.ConflictException('Projeto com este nome já existe');
            }
        }
        Object.assign(project, updateProjectDto);
        return await this.projectRepository.save(project);
    }
    async remove(id) {
        const project = await this.findOne(id);
        if (project.domains && project.domains.length > 0) {
            throw new common_1.ConflictException('Não é possível excluir projeto que possui domínios associados. ' +
                'Remova ou transfira os domínios primeiro.');
        }
        await this.projectRepository.remove(project);
    }
    async getStats() {
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
        const totalDomains = projectsWithDomains.reduce((sum, project) => sum + parseInt(project.domainCount || 0), 0);
        return {
            total,
            active,
            inactive,
            totalDomains,
            avgDomainsPerProject: total > 0 ? Math.round(totalDomains / total * 100) / 100 : 0,
        };
    }
};
exports.ProjectsService = ProjectsService;
exports.ProjectsService = ProjectsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(project_entity_1.Project)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], ProjectsService);
//# sourceMappingURL=projects.service.js.map