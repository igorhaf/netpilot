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
const child_process_1 = require("child_process");
const util_1 = require("util");
const fs = require("fs/promises");
const project_entity_1 = require("../../entities/project.entity");
const logs_service_1 = require("../logs/logs.service");
const log_entity_1 = require("../../entities/log.entity");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
let ProjectsService = class ProjectsService {
    constructor(projectRepository, logsService) {
        this.projectRepository = projectRepository;
        this.logsService = logsService;
    }
    async create(createProjectDto) {
        const log = await this.logsService.createLog(log_entity_1.LogType.PROJECT, 'Criar projeto', `Criando projeto ${createProjectDto.name}`);
        try {
            const existingProject = await this.projectRepository.findOne({
                where: { name: createProjectDto.name },
            });
            if (existingProject) {
                await this.logsService.updateLogStatus(log.id, log_entity_1.LogStatus.FAILED, 'Projeto com este nome já existe');
                throw new common_1.ConflictException('Projeto com este nome já existe');
            }
            const existingAlias = await this.projectRepository.findOne({
                where: { alias: createProjectDto.alias },
            });
            if (existingAlias) {
                await this.logsService.updateLogStatus(log.id, log_entity_1.LogStatus.FAILED, 'Projeto com este alias já existe');
                throw new common_1.ConflictException('Projeto com este alias já existe');
            }
            const username = createProjectDto.alias;
            const projectPath = `/home/${username}`;
            console.log(`👤 Criando usuário Linux: ${username}`);
            try {
                await execAsync(`sudo groupadd projects 2>&1 || true`);
                await execAsync(`sudo useradd -m -s /bin/bash -G projects ${username}`);
                console.log(`✅ Usuário ${username} criado com sucesso no grupo projects`);
            }
            catch (userError) {
                const checkUser = await execAsync(`id ${username} 2>&1 || true`);
                if (!checkUser.stdout.includes('uid=')) {
                    throw new common_1.ConflictException(`Falha ao criar usuário Linux: ${userError.message}`);
                }
                await execAsync(`sudo usermod -a -G projects ${username} 2>&1 || true`);
                console.log(`ℹ️ Usuário ${username} já existe, adicionado ao grupo projects`);
            }
            const project = this.projectRepository.create(createProjectDto);
            const savedProject = await this.projectRepository.save(project);
            try {
                const codePath = `${projectPath}/code`;
                const contextsPath = `${projectPath}/contexts`;
                console.log(`📁 Criando pasta contexts: ${contextsPath}`);
                await execAsync(`sudo -u ${username} mkdir -p "${contextsPath}"`);
                await execAsync(`sudo chmod 755 "${contextsPath}"`);
                console.log(`✅ Pasta contexts criada em: ${contextsPath}`);
                if (createProjectDto.repository && createProjectDto.repository.trim()) {
                    console.log(`🔄 Clonando repositório: ${createProjectDto.repository}`);
                    try {
                        await execAsync(`sudo -u ${username} git clone "${createProjectDto.repository}" "${codePath}"`, { timeout: 180000 });
                        savedProject.cloned = true;
                        await this.projectRepository.save(savedProject);
                        console.log(`✅ Repositório clonado em: ${codePath}`);
                    }
                    catch (cloneError) {
                        console.error(`❌ Erro ao clonar repositório: ${cloneError.message}`);
                    }
                }
                await execAsync(`sudo chown -R ${username}:${username} ${projectPath}`);
                console.log(`✅ Permissões configuradas para ${username}`);
                await this.logsService.updateLogStatus(log.id, log_entity_1.LogStatus.SUCCESS, `Projeto ${savedProject.name} criado com sucesso (usuário: ${username}, pasta: ${projectPath}, contexts: ${contextsPath}${savedProject.cloned ? ', repositório clonado' : ''})`, JSON.stringify({
                    id: savedProject.id,
                    name: savedProject.name,
                    username: username,
                    path: projectPath,
                    cloned: savedProject.cloned
                }));
                return savedProject;
            }
            catch (error) {
                console.error(`❌ Erro ao configurar projeto: ${error.message}`);
                await this.projectRepository.remove(savedProject);
                await this.logsService.updateLogStatus(log.id, log_entity_1.LogStatus.FAILED, `Falha ao configurar projeto: ${error.message}`, error.stack);
                throw new common_1.ConflictException(`Falha ao criar projeto: ${error.message}. Verifique se o repositório é válido e acessível.`);
            }
        }
        catch (error) {
            if (error instanceof common_1.ConflictException) {
                throw error;
            }
            await this.logsService.updateLogStatus(log.id, log_entity_1.LogStatus.FAILED, error.message || 'Erro ao criar projeto', error.stack);
            throw error;
        }
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
        const log = await this.logsService.createLog(log_entity_1.LogType.PROJECT, 'Atualizar projeto', `Atualizando projeto ${id}`);
        try {
            const project = await this.findOne(id);
            if (updateProjectDto.name && updateProjectDto.name !== project.name) {
                const existingProject = await this.projectRepository.findOne({
                    where: { name: updateProjectDto.name },
                });
                if (existingProject) {
                    await this.logsService.updateLogStatus(log.id, log_entity_1.LogStatus.FAILED, 'Projeto com este nome já existe');
                    throw new common_1.ConflictException('Projeto com este nome já existe');
                }
            }
            Object.assign(project, updateProjectDto);
            const updated = await this.projectRepository.save(project);
            await this.logsService.updateLogStatus(log.id, log_entity_1.LogStatus.SUCCESS, `Projeto ${updated.name} atualizado com sucesso`, JSON.stringify({ id: updated.id, changes: updateProjectDto }));
            return updated;
        }
        catch (error) {
            await this.logsService.updateLogStatus(log.id, log_entity_1.LogStatus.FAILED, error.message || 'Erro ao atualizar projeto', error.stack);
            throw error;
        }
    }
    async remove(id) {
        const log = await this.logsService.createLog(log_entity_1.LogType.PROJECT, 'Remover projeto', `Removendo projeto ${id}`);
        try {
            const project = await this.findOne(id);
            const projectName = project.name;
            const username = project.alias;
            if (project.domains && project.domains.length > 0) {
                await this.logsService.updateLogStatus(log.id, log_entity_1.LogStatus.FAILED, 'Projeto possui domínios associados');
                throw new common_1.ConflictException('Não é possível excluir projeto que possui domínios associados. ' +
                    'Remova ou transfira os domínios primeiro.');
            }
            await this.projectRepository.remove(project);
            const deletionDate = new Date();
            deletionDate.setDate(deletionDate.getDate() + 30);
            try {
                const cleanupScript = `
#!/bin/bash
echo "🗑️  Iniciando limpeza do projeto ${projectName} (usuário: ${username})"

# Verificar se o usuário existe
if id "${username}" &>/dev/null; then
  echo "Removendo usuário ${username} e sua pasta..."
  sudo userdel -r ${username} 2>/dev/null || true
  echo "✅ Usuário ${username} removido"
else
  echo "⚠️  Usuário ${username} não encontrado"
fi

# Garantir que a pasta foi removida
if [ -d "/home/${username}" ]; then
  echo "Removendo pasta /home/${username}..."
  sudo rm -rf /home/${username}
  echo "✅ Pasta removida"
fi

echo "🎉 Limpeza concluída para ${projectName}"
        `.trim();
                const scriptPath = `/tmp/cleanup-${username}-${Date.now()}.sh`;
                await fs.writeFile(scriptPath, cleanupScript);
                await execAsync(`chmod +x ${scriptPath}`);
                console.log(`📅 Job de limpeza agendado para ${deletionDate.toISOString()} (${username})`);
                console.log(`📝 Script criado em: ${scriptPath}`);
            }
            catch (jobError) {
                console.warn(`⚠️  Erro ao criar job de limpeza: ${jobError.message}`);
            }
            await this.logsService.updateLogStatus(log.id, log_entity_1.LogStatus.SUCCESS, `Projeto ${projectName} removido. Usuário e pasta serão deletados em 30 dias.`, JSON.stringify({ username, deletionDate: deletionDate.toISOString() }));
        }
        catch (error) {
            await this.logsService.updateLogStatus(log.id, log_entity_1.LogStatus.FAILED, error.message || 'Erro ao remover projeto', error.stack);
            throw error;
        }
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
    async cloneRepository(id) {
        const log = await this.logsService.createLog(log_entity_1.LogType.PROJECT, 'Clonar repositório', `Clonando repositório do projeto ${id}`);
        try {
            const project = await this.findOne(id);
            if (project.cloned) {
                await this.logsService.updateLogStatus(log.id, log_entity_1.LogStatus.FAILED, 'Repositório já foi clonado anteriormente');
                throw new common_1.ConflictException('Repositório já foi clonado anteriormente');
            }
            if (!project.repository || !project.repository.trim()) {
                await this.logsService.updateLogStatus(log.id, log_entity_1.LogStatus.FAILED, 'Projeto não possui repositório configurado');
                throw new common_1.ConflictException('Projeto não possui repositório configurado');
            }
            const username = project.alias;
            const projectPath = `/home/${username}`;
            const codePath = `${projectPath}/code`;
            console.log(`🔄 Clonando repositório: ${project.repository}`);
            try {
                await execAsync(`sudo -u ${username} git clone "${project.repository}" "${codePath}"`, { timeout: 180000 });
                project.cloned = true;
                const savedProject = await this.projectRepository.save(project);
                console.log(`✅ Repositório clonado em: ${codePath}`);
                await this.logsService.updateLogStatus(log.id, log_entity_1.LogStatus.SUCCESS, `Repositório clonado com sucesso em ${codePath}`, JSON.stringify({ projectId: savedProject.id, path: codePath }));
                return savedProject;
            }
            catch (cloneError) {
                console.error(`❌ Erro ao clonar repositório: ${cloneError.message}`);
                await this.logsService.updateLogStatus(log.id, log_entity_1.LogStatus.FAILED, `Erro ao clonar repositório: ${cloneError.message}`, cloneError.stack);
                throw new common_1.ConflictException(`Falha ao clonar repositório: ${cloneError.message}. Verifique se o repositório é válido e acessível.`);
            }
        }
        catch (error) {
            if (error instanceof common_1.ConflictException || error instanceof common_1.NotFoundException) {
                throw error;
            }
            await this.logsService.updateLogStatus(log.id, log_entity_1.LogStatus.FAILED, error.message || 'Erro ao clonar repositório', error.stack);
            throw error;
        }
    }
    async generateSshKey(id) {
        const log = await this.logsService.createLog(log_entity_1.LogType.PROJECT, 'Gerar chave SSH', `Gerando chave SSH para projeto ${id}`);
        try {
            const project = await this.findOne(id);
            if (project.hasSshKey) {
                await this.logsService.updateLogStatus(log.id, log_entity_1.LogStatus.FAILED, 'Projeto já possui chave SSH configurada');
                throw new common_1.ConflictException('Projeto já possui chave SSH. Delete a chave existente antes de gerar uma nova.');
            }
            const username = project.alias;
            const sshDir = `/home/${username}/.ssh`;
            const privateKeyPath = `${sshDir}/id_rsa`;
            const publicKeyPath = `${sshDir}/id_rsa.pub`;
            console.log(`🔑 Gerando chave SSH para usuário: ${username}`);
            await execAsync(`sudo -u ${username} mkdir -p ${sshDir}`);
            await execAsync(`sudo chmod 700 ${sshDir}`);
            await execAsync(`sudo -u ${username} ssh-keygen -t rsa -b 4096 -f ${privateKeyPath} -N "" -C "${username}@netpilot"`, { timeout: 30000 });
            await execAsync(`sudo chmod 600 ${privateKeyPath}`);
            await execAsync(`sudo chmod 644 ${publicKeyPath}`);
            const { stdout: publicKey } = await execAsync(`sudo cat ${publicKeyPath}`);
            const { stdout: fingerprint } = await execAsync(`sudo ssh-keygen -lf ${publicKeyPath} -E sha256 | awk '{print $2}'`);
            project.hasSshKey = true;
            project.sshPublicKey = publicKey.trim();
            project.sshKeyFingerprint = fingerprint.trim();
            const savedProject = await this.projectRepository.save(project);
            console.log(`✅ Chave SSH gerada com sucesso para ${username}`);
            console.log(`   Fingerprint: ${fingerprint.trim()}`);
            await this.logsService.updateLogStatus(log.id, log_entity_1.LogStatus.SUCCESS, `Chave SSH gerada com sucesso`, JSON.stringify({
                projectId: savedProject.id,
                fingerprint: fingerprint.trim(),
                publicKeyPath
            }));
            return savedProject;
        }
        catch (error) {
            if (error instanceof common_1.ConflictException || error instanceof common_1.NotFoundException) {
                throw error;
            }
            await this.logsService.updateLogStatus(log.id, log_entity_1.LogStatus.FAILED, error.message || 'Erro ao gerar chave SSH', error.stack);
            throw new common_1.ConflictException(`Falha ao gerar chave SSH: ${error.message}`);
        }
    }
    async getSshPublicKey(id) {
        const project = await this.findOne(id);
        if (!project.hasSshKey) {
            throw new common_1.NotFoundException('Projeto não possui chave SSH configurada');
        }
        return {
            publicKey: project.sshPublicKey,
            fingerprint: project.sshKeyFingerprint
        };
    }
    async deleteSshKey(id) {
        const log = await this.logsService.createLog(log_entity_1.LogType.PROJECT, 'Deletar chave SSH', `Deletando chave SSH do projeto ${id}`);
        try {
            const project = await this.findOne(id);
            if (!project.hasSshKey) {
                await this.logsService.updateLogStatus(log.id, log_entity_1.LogStatus.FAILED, 'Projeto não possui chave SSH configurada');
                throw new common_1.NotFoundException('Projeto não possui chave SSH configurada');
            }
            const username = project.alias;
            const sshDir = `/home/${username}/.ssh`;
            console.log(`🗑️ Deletando chaves SSH para usuário: ${username}`);
            await execAsync(`sudo rm -f ${sshDir}/id_rsa ${sshDir}/id_rsa.pub`);
            project.hasSshKey = false;
            project.sshPublicKey = null;
            project.sshKeyFingerprint = null;
            const savedProject = await this.projectRepository.save(project);
            console.log(`✅ Chaves SSH deletadas para ${username}`);
            await this.logsService.updateLogStatus(log.id, log_entity_1.LogStatus.SUCCESS, `Chaves SSH deletadas com sucesso`, JSON.stringify({ projectId: savedProject.id }));
            return savedProject;
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            await this.logsService.updateLogStatus(log.id, log_entity_1.LogStatus.FAILED, error.message || 'Erro ao deletar chave SSH', error.stack);
            throw new common_1.ConflictException(`Falha ao deletar chave SSH: ${error.message}`);
        }
    }
};
exports.ProjectsService = ProjectsService;
exports.ProjectsService = ProjectsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(project_entity_1.Project)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        logs_service_1.LogsService])
], ProjectsService);
//# sourceMappingURL=projects.service.js.map