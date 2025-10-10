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
const preset_entity_1 = require("../../entities/preset.entity");
const job_queue_entity_1 = require("../../entities/job-queue.entity");
const job_execution_entity_1 = require("../../entities/job-execution.entity");
const logs_service_1 = require("../logs/logs.service");
const log_entity_1 = require("../../entities/log.entity");
const chat_service_1 = require("../chat/chat.service");
const chat_message_entity_1 = require("../../entities/chat-message.entity");
const job_execution_entity_2 = require("../../entities/job-execution.entity");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
let ProjectsService = class ProjectsService {
    constructor(projectRepository, presetRepository, jobQueueRepository, jobExecutionRepository, logsService, chatService) {
        this.projectRepository = projectRepository;
        this.presetRepository = presetRepository;
        this.jobQueueRepository = jobQueueRepository;
        this.jobExecutionRepository = jobExecutionRepository;
        this.logsService = logsService;
        this.chatService = chatService;
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
            const { presetIds, ...projectData } = createProjectDto;
            const project = this.projectRepository.create(projectData);
            if (presetIds && presetIds.length > 0) {
                const presets = await this.presetRepository.findBy({ id: (0, typeorm_2.In)(presetIds) });
                project.presets = presets;
            }
            const savedProject = await this.projectRepository.save(project);
            try {
                const codePath = `${projectPath}/code`;
                const contextsPath = `${projectPath}/contexts`;
                console.log(`📁 Criando pasta code: ${codePath}`);
                await execAsync(`sudo -u ${username} mkdir -p "${codePath}"`);
                await execAsync(`sudo chmod 755 "${codePath}"`);
                console.log(`✅ Pasta code criada em: ${codePath}`);
                console.log(`📁 Criando pasta contexts: ${contextsPath}`);
                await execAsync(`sudo -u ${username} mkdir -p "${contextsPath}"`);
                await execAsync(`sudo chmod 755 "${contextsPath}"`);
                console.log(`✅ Pasta contexts criada em: ${contextsPath}`);
                if (createProjectDto.repository && createProjectDto.repository.trim()) {
                    console.log(`🔄 Clonando repositório: ${createProjectDto.repository}`);
                    try {
                        const systemOpsUrl = process.env.SYSTEM_OPS_URL || 'http://172.18.0.1:8001';
                        const axios = require('axios');
                        const response = await axios.post(`${systemOpsUrl}/git/clone`, {
                            repository: createProjectDto.repository,
                            targetPath: codePath,
                            username: username
                        }, {
                            timeout: 300000
                        });
                        console.log(`✅ ${response.data.message}`);
                        savedProject.cloned = true;
                        await this.projectRepository.save(savedProject);
                    }
                    catch (cloneError) {
                        console.error(`❌ Erro ao clonar repositório: ${cloneError.message}`);
                    }
                }
                await this.applyPresetsToProject(savedProject, contextsPath, username);
                await execAsync(`sudo chown -R ${username}:${username} ${projectPath}`);
                await execAsync(`sudo chmod o+x ${projectPath}`);
                await execAsync(`sudo chmod o+rx ${codePath}`);
                await execAsync(`sudo chmod o+rx ${contextsPath}`);
                console.log(`✅ Permissões configuradas para ${username}`);
                console.log(`⚙️ Criando job queue para o projeto ${savedProject.name}`);
                const jobQueue = this.jobQueueRepository.create({
                    name: `Terminal - ${savedProject.name}`,
                    description: `Executa comandos shell no projeto ${savedProject.name}`,
                    scriptType: job_queue_entity_1.ScriptType.SHELL,
                    scriptPath: 'echo "Terminal command"',
                    isActive: true,
                    priority: 5,
                    metadata: {
                        projectId: savedProject.id,
                        projectPath: projectPath,
                        isTerminal: true,
                    },
                });
                const savedJobQueue = await this.jobQueueRepository.save(jobQueue);
                savedProject.jobQueueId = savedJobQueue.id;
                await this.projectRepository.save(savedProject);
                console.log(`✅ Job queue criado: ${savedJobQueue.id}`);
                await this.logsService.updateLogStatus(log.id, log_entity_1.LogStatus.SUCCESS, `Projeto ${savedProject.name} criado com sucesso (usuário: ${username}, pasta: ${projectPath}, contexts: ${contextsPath}${savedProject.cloned ? ', repositório clonado' : ''})`, JSON.stringify({
                    id: savedProject.id,
                    name: savedProject.name,
                    username: username,
                    path: projectPath,
                    cloned: savedProject.cloned,
                    jobQueueId: savedJobQueue.id,
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
                const systemOpsUrl = process.env.SYSTEM_OPS_URL || 'http://172.18.0.1:8001';
                const axios = require('axios');
                const response = await axios.post(`${systemOpsUrl}/git/clone`, {
                    repository: project.repository,
                    targetPath: codePath,
                    username: username
                }, {
                    timeout: 300000
                });
                console.log(`✅ ${response.data.message}`);
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
            const fsSync = require('fs');
            const isDocker = fsSync.existsSync('/host/home');
            let sshDir = `/home/${username}/.ssh`;
            if (isDocker) {
                sshDir = `/host/home/${username}/.ssh`;
            }
            const privateKeyPath = `${sshDir}/id_rsa`;
            const publicKeyPath = `${sshDir}/id_rsa.pub`;
            console.log(`🔑 Gerando chave SSH para usuário: ${username} (Docker: ${isDocker})`);
            if (isDocker) {
                await execAsync(`mkdir -p ${sshDir}`);
                await execAsync(`chmod 700 ${sshDir}`);
                await execAsync(`ssh-keygen -t rsa -b 4096 -f ${privateKeyPath} -N "" -C "${username}@netpilot"`, { timeout: 30000 });
                await execAsync(`chmod 600 ${privateKeyPath}`);
                await execAsync(`chmod 644 ${publicKeyPath}`);
                const { stdout: publicKey } = await execAsync(`cat ${publicKeyPath}`);
                const { stdout: fingerprint } = await execAsync(`ssh-keygen -lf ${publicKeyPath} -E sha256 | awk '{print $2}'`);
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
            else {
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
            const fsSync = require('fs');
            const isDocker = fsSync.existsSync('/host/home');
            let sshDir = `/home/${username}/.ssh`;
            if (isDocker) {
                sshDir = `/host/home/${username}/.ssh`;
            }
            console.log(`🗑️ Deletando chaves SSH para usuário: ${username} (Docker: ${isDocker})`);
            if (isDocker) {
                await execAsync(`rm -f ${sshDir}/id_rsa ${sshDir}/id_rsa.pub`);
            }
            else {
                await execAsync(`sudo rm -f ${sshDir}/id_rsa ${sshDir}/id_rsa.pub`);
            }
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
    async applyPresetsToProject(project, contextsPath, username) {
        console.log(`📦 Aplicando presets ao projeto ${project.name}...`);
        const subdirs = ['docker', 'personas', 'configs', 'scripts', 'templates'];
        for (const subdir of subdirs) {
            const dirPath = `${contextsPath}/${subdir}`;
            await execAsync(`sudo -u ${username} mkdir -p "${dirPath}"`);
            console.log(`  📁 Criado: ${subdir}/`);
        }
        let totalPresets = 0;
        if (project.presets && project.presets.length > 0) {
            console.log(`  📎 Aplicando ${project.presets.length} presets`);
            for (const preset of project.presets) {
                await this.writePresetFile(contextsPath, preset, username);
                totalPresets++;
            }
        }
        console.log(`✅ ${totalPresets} preset${totalPresets !== 1 ? 's' : ''} aplicado${totalPresets !== 1 ? 's' : ''}`);
    }
    async writePresetFile(basePath, preset, username) {
        const typeDir = {
            'docker': 'docker',
            'persona': 'personas',
            'config': 'configs',
            'script': 'scripts',
            'template': 'templates'
        }[preset.type];
        const filename = preset.filename || `${preset.name.toLowerCase().replace(/\s+/g, '-')}.${this.getPresetExtension(preset)}`;
        const fullPath = `${basePath}/${typeDir}/${filename}`;
        const tempFile = `/tmp/preset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        await fs.writeFile(tempFile, preset.content, 'utf-8');
        await execAsync(`sudo mv ${tempFile} "${fullPath}"`);
        await execAsync(`sudo chown ${username}:${username} "${fullPath}"`);
        if (preset.type === 'script') {
            await execAsync(`sudo chmod +x "${fullPath}"`);
        }
        else {
            await execAsync(`sudo chmod 644 "${fullPath}"`);
        }
        console.log(`    ✓ ${typeDir}/${filename}`);
    }
    getPresetExtension(preset) {
        if (preset.filename && preset.filename.includes('.')) {
            return preset.filename.split('.').pop();
        }
        if (preset.language) {
            const langMap = {
                'yaml': 'yml',
                'json': 'json',
                'javascript': 'js',
                'typescript': 'ts',
                'python': 'py',
                'bash': 'sh',
                'shell': 'sh',
                'markdown': 'md',
                'text': 'txt',
                'nginx': 'conf'
            };
            return langMap[preset.language.toLowerCase()] || 'txt';
        }
        const typeMap = {
            'docker': 'yml',
            'persona': 'md',
            'config': 'conf',
            'script': 'sh',
            'template': 'txt'
        };
        return typeMap[preset.type] || 'txt';
    }
    async ensureProjectJob(project) {
        if (project.jobQueueId) {
            const existingJob = await this.jobQueueRepository.findOne({
                where: { id: project.jobQueueId }
            });
            if (existingJob) {
                console.log(`✅ Job já existe para ${project.name}: ${project.jobQueueId}`);
                return;
            }
        }
        console.log(`⚙️ Recriando job queue para o projeto ${project.name}`);
        const projectPath = `/home/${project.alias}`;
        const jobQueue = this.jobQueueRepository.create({
            name: `Terminal - ${project.name}`,
            description: `Executa comandos shell no projeto ${project.name}`,
            scriptType: job_queue_entity_1.ScriptType.SHELL,
            scriptPath: 'echo "Terminal command"',
            isActive: true,
            priority: 5,
            metadata: {
                projectId: project.id,
                projectPath: projectPath,
                isTerminal: true,
            },
        });
        const savedJobQueue = await this.jobQueueRepository.save(jobQueue);
        project.jobQueueId = savedJobQueue.id;
        await this.projectRepository.save(project);
        console.log(`✅ Job queue recriado: ${savedJobQueue.id}`);
    }
    async executePromptRealtime(id, userPrompt, userId) {
        const project = await this.findOne(id);
        const startTime = Date.now();
        const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        console.log(`🤖 Executando prompt em tempo real para ${project.name}`);
        console.log(`💬 Prompt: ${userPrompt}`);
        await this.ensureProjectJob(project);
        const jobExecution = this.jobExecutionRepository.create({
            status: job_execution_entity_2.ExecutionStatus.RUNNING,
            startedAt: new Date(),
            triggerType: job_execution_entity_2.TriggerType.MANUAL,
            metadata: {
                type: 'ai-prompt',
                projectId: id,
                userPrompt: userPrompt,
                executionMode: 'realtime',
            },
        });
        await this.jobExecutionRepository.save(jobExecution);
        const userMessage = await this.chatService.create({
            role: chat_message_entity_1.ChatMessageRole.USER,
            content: userPrompt,
            projectId: id,
            userId,
            sessionId,
            status: chat_message_entity_1.ChatMessageStatus.COMPLETED,
            metadata: { jobExecutionId: jobExecution.id },
        });
        try {
            const fsSync = require('fs');
            const projectPath = `/home/${project.alias}/code`;
            const selectedAgent = 'bender';
            let output = '';
            try {
                const systemOpsUrl = process.env.SYSTEM_OPS_URL || 'http://172.18.0.1:8001';
                const axios = require('axios');
                const response = await axios.post(`${systemOpsUrl}/claude/execute`, {
                    projectPath: projectPath,
                    prompt: userPrompt,
                    agent: selectedAgent,
                    timeoutSeconds: 300
                }, {
                    timeout: 300000
                });
                const result = response.data;
                output = result.stdout || 'Sem saída';
                if (result.stderr && result.stderr.trim()) {
                    output += `\n\n⚠️ ${result.stderr}`;
                }
                jobExecution.status = job_execution_entity_2.ExecutionStatus.COMPLETED;
                jobExecution.completedAt = new Date();
                jobExecution.executionTimeMs = Date.now() - startTime;
                jobExecution.outputLog = output;
                await this.jobExecutionRepository.save(jobExecution);
                await this.chatService.create({
                    role: chat_message_entity_1.ChatMessageRole.ASSISTANT,
                    content: output,
                    projectId: id,
                    sessionId,
                    status: chat_message_entity_1.ChatMessageStatus.COMPLETED,
                    metadata: {
                        executionTimeMs: Date.now() - startTime,
                        agent: selectedAgent,
                        jobExecutionId: jobExecution.id,
                    },
                });
                return {
                    success: true,
                    output,
                    executionTimeMs: Date.now() - startTime,
                    sessionId
                };
            }
            catch (error) {
                output += `❌ Erro na execução:\n${error.message}\n`;
                if (error.stderr) {
                    output += `\n${error.stderr}\n`;
                }
                jobExecution.status = job_execution_entity_2.ExecutionStatus.FAILED;
                jobExecution.completedAt = new Date();
                jobExecution.executionTimeMs = Date.now() - startTime;
                jobExecution.errorLog = output;
                await this.jobExecutionRepository.save(jobExecution);
                await this.chatService.create({
                    role: chat_message_entity_1.ChatMessageRole.ASSISTANT,
                    content: output,
                    projectId: id,
                    sessionId,
                    status: chat_message_entity_1.ChatMessageStatus.ERROR,
                    metadata: { jobExecutionId: jobExecution.id },
                });
                return {
                    success: false,
                    output,
                    executionTimeMs: Date.now() - startTime,
                    sessionId
                };
            }
        }
        catch (error) {
            console.error('❌ Erro ao executar prompt:', error);
            const errorOutput = `Erro ao executar prompt: ${error.message}`;
            try {
                jobExecution.status = job_execution_entity_2.ExecutionStatus.FAILED;
                jobExecution.completedAt = new Date();
                jobExecution.executionTimeMs = Date.now() - startTime;
                jobExecution.errorLog = errorOutput;
                await this.jobExecutionRepository.save(jobExecution);
            }
            catch (saveError) {
                console.error('Erro ao salvar job execution:', saveError);
            }
            try {
                await this.chatService.create({
                    role: chat_message_entity_1.ChatMessageRole.ASSISTANT,
                    content: errorOutput,
                    projectId: id,
                    sessionId,
                    status: chat_message_entity_1.ChatMessageStatus.ERROR,
                    metadata: {
                        error: error.message,
                        stack: error.stack,
                        jobExecutionId: jobExecution.id,
                    },
                });
            }
            catch (chatError) {
                console.error('Erro ao salvar mensagem de erro:', chatError);
            }
            return {
                success: false,
                output: errorOutput,
                executionTimeMs: Date.now() - startTime,
                sessionId
            };
        }
    }
    async executeCommand(id, command, userId) {
        const project = await this.findOne(id);
        const startTime = Date.now();
        const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        console.log(`🖥️ Executando comando para ${project.name}: ${command}`);
        await this.ensureProjectJob(project);
        const projectPath = `/home/${project.alias}`;
        const jobExecution = this.jobExecutionRepository.create({
            status: job_execution_entity_2.ExecutionStatus.RUNNING,
            startedAt: new Date(),
            triggerType: job_execution_entity_2.TriggerType.MANUAL,
            metadata: {
                type: 'terminal-command',
                projectId: id,
                command: command,
                executionMode: project.executionMode,
            },
        });
        await this.jobExecutionRepository.save(jobExecution);
        const formattedCommand = '$ ' + command;
        await this.chatService.create({
            role: chat_message_entity_1.ChatMessageRole.USER,
            content: formattedCommand,
            projectId: id,
            userId,
            sessionId,
            status: chat_message_entity_1.ChatMessageStatus.COMPLETED,
            metadata: { jobExecutionId: jobExecution.id, isCommand: true },
        });
        try {
            const systemOpsUrl = process.env.SYSTEM_OPS_URL || 'http://172.18.0.1:8001';
            const axios = require('axios');
            const response = await axios.post(`${systemOpsUrl}/system/execute-command-stream`, {
                command: command,
                workingDirectory: `${projectPath}/code`,
                timeout: 300
            }, {
                timeout: 300000,
                responseType: 'stream'
            });
            let output = '';
            let tempOutput = '';
            const assistantMessage = await this.chatService.create({
                role: chat_message_entity_1.ChatMessageRole.ASSISTANT,
                content: '```bash\n```',
                projectId: id,
                sessionId,
                status: chat_message_entity_1.ChatMessageStatus.STREAMING,
                metadata: { jobExecutionId: jobExecution.id, isCommandOutput: true },
            });
            for await (const chunk of response.data) {
                const line = chunk.toString();
                output += line;
                tempOutput += line;
                if (tempOutput.split('\n').length > 5) {
                    const formattedOutput = '```bash\n' + output + '\n```';
                    await this.chatService.update(assistantMessage.id, {
                        content: formattedOutput,
                        status: chat_message_entity_1.ChatMessageStatus.STREAMING,
                    });
                    tempOutput = '';
                }
            }
            if (!output.trim()) {
                output = '[Comando executado com sucesso - sem saída]';
            }
            const formattedOutput = '```bash\n' + output + '\n```';
            jobExecution.status = job_execution_entity_2.ExecutionStatus.COMPLETED;
            jobExecution.completedAt = new Date();
            jobExecution.executionTimeMs = Date.now() - startTime;
            jobExecution.outputLog = output;
            await this.jobExecutionRepository.save(jobExecution);
            await this.chatService.update(assistantMessage.id, {
                content: formattedOutput,
                status: chat_message_entity_1.ChatMessageStatus.COMPLETED,
            });
            console.log(`✅ Comando executado com sucesso`);
            return {
                success: true,
                output,
                executionTimeMs: Date.now() - startTime,
                sessionId,
            };
        }
        catch (error) {
            console.error(`❌ Erro ao executar comando: ${error.message}`);
            let errorOutput = `Erro: ${error.message}`;
            if (error.stdout)
                errorOutput += `\n\nSaída padrão:\n${error.stdout}`;
            if (error.stderr)
                errorOutput += `\n\nSaída de erro:\n${error.stderr}`;
            const formattedError = '```bash\n' + errorOutput + '\n```';
            jobExecution.status = job_execution_entity_2.ExecutionStatus.FAILED;
            jobExecution.completedAt = new Date();
            jobExecution.executionTimeMs = Date.now() - startTime;
            jobExecution.errorLog = errorOutput;
            await this.jobExecutionRepository.save(jobExecution);
            await this.chatService.create({
                role: chat_message_entity_1.ChatMessageRole.ASSISTANT,
                content: formattedError,
                projectId: id,
                sessionId,
                status: chat_message_entity_1.ChatMessageStatus.ERROR,
                metadata: { jobExecutionId: jobExecution.id, isCommandOutput: true, error: error.message },
            });
            return {
                success: false,
                output: errorOutput,
                executionTimeMs: Date.now() - startTime,
                sessionId,
            };
        }
    }
    async loadContexts(contextsPath) {
        const result = {
            personas: [],
            configs: [],
            docker: [],
            scripts: [],
            templates: [],
            totalFiles: 0
        };
        const fsSync = require('fs');
        if (!fsSync.existsSync(contextsPath)) {
            return result;
        }
        try {
            const personasPath = `${contextsPath}/personas`;
            if (fsSync.existsSync(personasPath)) {
                const files = await fs.readdir(personasPath);
                for (const file of files) {
                    const content = await fs.readFile(`${personasPath}/${file}`, 'utf-8');
                    result.personas.push({ name: file, content });
                    result.totalFiles++;
                }
            }
            const configsPath = `${contextsPath}/configs`;
            if (fsSync.existsSync(configsPath)) {
                const files = await fs.readdir(configsPath);
                result.configs = files.map(f => ({ name: f }));
                result.totalFiles += files.length;
            }
            const dockerPath = `${contextsPath}/docker`;
            if (fsSync.existsSync(dockerPath)) {
                const files = await fs.readdir(dockerPath);
                result.docker = files.map(f => ({ name: f }));
                result.totalFiles += files.length;
            }
        }
        catch (error) {
            console.error('Erro ao carregar contextos:', error);
        }
        return result;
    }
    async getProjectPresets(id) {
        const project = await this.projectRepository.findOne({
            where: { id },
            relations: ['presets'],
        });
        if (!project) {
            throw new common_1.NotFoundException(`Project with ID ${id} not found`);
        }
        const categorized = {
            tecnologias: [],
            personas: [],
            templates: [],
            configs: [],
            docker: [],
            scripts: [],
        };
        project.presets?.forEach((preset) => {
            const item = {
                id: preset.id,
                name: preset.name,
                type: preset.type,
                description: preset.description,
                language: preset.language,
                tags: preset.tags,
            };
            if (preset.type === 'persona') {
                categorized.personas.push(item);
            }
            else if (preset.type === 'template') {
                categorized.templates.push(item);
            }
            else if (preset.type === 'config') {
                categorized.configs.push(item);
            }
            else if (preset.type === 'docker') {
                categorized.docker.push(item);
            }
            else if (preset.type === 'script') {
                categorized.scripts.push(item);
            }
            if (preset.tags?.includes('tecnologia')) {
                categorized.tecnologias.push(item);
            }
        });
        return {
            presets: project.presets,
            categorized,
        };
    }
    async updateProjectPresets(id, presetIds) {
        const project = await this.projectRepository.findOne({
            where: { id },
            relations: ['presets'],
        });
        if (!project) {
            throw new common_1.NotFoundException(`Project with ID ${id} not found`);
        }
        const presets = await this.presetRepository.findBy({
            id: (0, typeorm_2.In)(presetIds)
        });
        project.presets = presets;
        await this.projectRepository.save(project);
        const username = project.alias;
        const contextsPath = `/home/${username}/contexts`;
        try {
            const fsSync = require('fs');
            const isDocker = fsSync.existsSync('/host/home');
            if (isDocker) {
                await execAsync(`rm -rf /host${contextsPath}/*`);
            }
            else {
                await execAsync(`sudo rm -rf ${contextsPath}/*`);
            }
            await this.applyPresetsToProject(project, contextsPath, username);
            console.log(`✅ Presets atualizados para o projeto ${project.name}`);
        }
        catch (error) {
            console.error('Erro ao re-aplicar presets:', error);
        }
        return this.getProjectPresets(id);
    }
    async getGitStatus(id) {
        const project = await this.findOne(id);
        if (!project.cloned) {
            throw new common_1.ConflictException('Repositório não foi clonado ainda');
        }
        const username = project.alias;
        const codePath = `/home/${username}/code`;
        try {
            const fsSync = require('fs');
            const isDocker = fsSync.existsSync('/host/home');
            let gitStatusCmd;
            let gitBranchCmd;
            if (isDocker) {
                gitStatusCmd = `cd ${codePath} && git status --porcelain`;
                gitBranchCmd = `cd ${codePath} && git branch --show-current`;
            }
            else {
                gitStatusCmd = `sudo -u ${username} git -C ${codePath} status --porcelain`;
                gitBranchCmd = `sudo -u ${username} git -C ${codePath} branch --show-current`;
            }
            const { stdout: statusOutput } = await execAsync(gitStatusCmd);
            const { stdout: branchOutput } = await execAsync(gitBranchCmd);
            const files = statusOutput
                .split('\n')
                .filter(line => line.trim())
                .map(line => {
                const status = line.substring(0, 2);
                const filepath = line.substring(3);
                let type = 'modified';
                if (status.includes('?'))
                    type = 'untracked';
                else if (status.includes('D'))
                    type = 'deleted';
                else if (status.includes('A'))
                    type = 'added';
                else if (status.includes('M'))
                    type = 'modified';
                return { filepath, status: status.trim(), type };
            });
            return {
                branch: branchOutput.trim(),
                files,
                isClean: files.length === 0,
            };
        }
        catch (error) {
            console.error('❌ Erro ao obter status do git:', error);
            throw new common_1.ConflictException(`Erro ao obter status: ${error.message}`);
        }
    }
    async gitPull(id) {
        const log = await this.logsService.createLog(log_entity_1.LogType.PROJECT, 'Git Pull', `Executando git pull no projeto ${id}`);
        try {
            const project = await this.findOne(id);
            if (!project.cloned) {
                await this.logsService.updateLogStatus(log.id, log_entity_1.LogStatus.FAILED, 'Repositório não foi clonado ainda');
                throw new common_1.ConflictException('Repositório não foi clonado ainda');
            }
            const username = project.alias;
            const codePath = `/home/${username}/code`;
            console.log(`🔄 Executando git pull em: ${codePath}`);
            const fsSync = require('fs');
            const isDocker = fsSync.existsSync('/host/home');
            let pullCmd;
            if (isDocker) {
                pullCmd = `cd ${codePath} && git pull`;
            }
            else {
                pullCmd = `sudo -u ${username} git -C ${codePath} pull`;
            }
            const { stdout, stderr } = await execAsync(pullCmd, { timeout: 60000 });
            const output = stdout + (stderr ? `\n${stderr}` : '');
            console.log(`✅ Git pull executado com sucesso`);
            await this.logsService.updateLogStatus(log.id, log_entity_1.LogStatus.SUCCESS, `Git pull executado com sucesso`, output);
            return { success: true, output };
        }
        catch (error) {
            console.error(`❌ Erro ao executar git pull: ${error.message}`);
            await this.logsService.updateLogStatus(log.id, log_entity_1.LogStatus.FAILED, `Erro ao executar git pull: ${error.message}`, error.stack);
            throw new common_1.ConflictException(`Erro ao executar git pull: ${error.message}`);
        }
    }
    async gitCommit(id, message) {
        const log = await this.logsService.createLog(log_entity_1.LogType.PROJECT, 'Git Commit', `Executando git commit no projeto ${id}`);
        try {
            const project = await this.findOne(id);
            if (!project.cloned) {
                await this.logsService.updateLogStatus(log.id, log_entity_1.LogStatus.FAILED, 'Repositório não foi clonado ainda');
                throw new common_1.ConflictException('Repositório não foi clonado ainda');
            }
            const username = project.alias;
            const codePath = `/home/${username}/code`;
            console.log(`📝 Executando git commit em: ${codePath}`);
            const fsSync = require('fs');
            const isDocker = fsSync.existsSync('/host/home');
            let addCmd;
            let commitCmd;
            if (isDocker) {
                addCmd = `cd ${codePath} && git add -A`;
                commitCmd = `cd ${codePath} && git commit -m "${message.replace(/"/g, '\\"')}"`;
            }
            else {
                addCmd = `sudo -u ${username} git -C ${codePath} add -A`;
                commitCmd = `sudo -u ${username} git -C ${codePath} commit -m "${message.replace(/"/g, '\\"')}"`;
            }
            await execAsync(addCmd);
            const { stdout, stderr } = await execAsync(commitCmd, { timeout: 30000 });
            const output = stdout + (stderr ? `\n${stderr}` : '');
            console.log(`✅ Git commit executado com sucesso`);
            await this.logsService.updateLogStatus(log.id, log_entity_1.LogStatus.SUCCESS, `Git commit executado com sucesso`, output);
            return { success: true, output };
        }
        catch (error) {
            console.error(`❌ Erro ao executar git commit: ${error.message}`);
            await this.logsService.updateLogStatus(log.id, log_entity_1.LogStatus.FAILED, `Erro ao executar git commit: ${error.message}`, error.stack);
            throw new common_1.ConflictException(`Erro ao executar git commit: ${error.message}`);
        }
    }
    async gitPush(id) {
        const log = await this.logsService.createLog(log_entity_1.LogType.PROJECT, 'Git Push', `Executando git push no projeto ${id}`);
        try {
            const project = await this.findOne(id);
            if (!project.cloned) {
                await this.logsService.updateLogStatus(log.id, log_entity_1.LogStatus.FAILED, 'Repositório não foi clonado ainda');
                throw new common_1.ConflictException('Repositório não foi clonado ainda');
            }
            const username = project.alias;
            const codePath = `/home/${username}/code`;
            console.log(`⬆️ Executando git push em: ${codePath}`);
            const fsSync = require('fs');
            const isDocker = fsSync.existsSync('/host/home');
            let pushCmd;
            if (isDocker) {
                pushCmd = `cd ${codePath} && git push`;
            }
            else {
                pushCmd = `sudo -u ${username} git -C ${codePath} push`;
            }
            const { stdout, stderr } = await execAsync(pushCmd, { timeout: 60000 });
            const output = stdout + (stderr ? `\n${stderr}` : '');
            console.log(`✅ Git push executado com sucesso`);
            await this.logsService.updateLogStatus(log.id, log_entity_1.LogStatus.SUCCESS, `Git push executado com sucesso`, output);
            return { success: true, output };
        }
        catch (error) {
            console.error(`❌ Erro ao executar git push: ${error.message}`);
            await this.logsService.updateLogStatus(log.id, log_entity_1.LogStatus.FAILED, `Erro ao executar git push: ${error.message}`, error.stack);
            throw new common_1.ConflictException(`Erro ao executar git push: ${error.message}`);
        }
    }
    async getGitDiff(id) {
        const project = await this.findOne(id);
        if (!project.cloned) {
            throw new common_1.ConflictException('Repositório não foi clonado ainda');
        }
        const username = project.alias;
        const codePath = `/home/${username}/code`;
        try {
            const fsSync = require('fs');
            const isDocker = fsSync.existsSync('/host/home');
            let diffCmd;
            if (isDocker) {
                diffCmd = `cd ${codePath} && git diff`;
            }
            else {
                diffCmd = `sudo -u ${username} git -C ${codePath} diff`;
            }
            const { stdout } = await execAsync(diffCmd);
            return { diff: stdout };
        }
        catch (error) {
            console.error('❌ Erro ao obter diff do git:', error);
            throw new common_1.ConflictException(`Erro ao obter diff: ${error.message}`);
        }
    }
    async generateCommitMessage(id) {
        const project = await this.findOne(id);
        if (!project.cloned) {
            throw new common_1.ConflictException('Repositório não foi clonado ainda');
        }
        try {
            const { diff } = await this.getGitDiff(id);
            if (!diff || diff.trim() === '') {
                return { message: 'Nenhuma alteração detectada' };
            }
            const prompt = `Analise as seguintes alterações git diff e gere uma mensagem de commit clara, concisa e em português seguindo as convenções do Conventional Commits.

Use prefixos como:
- feat: para novas funcionalidades
- fix: para correções de bugs
- refactor: para refatorações
- docs: para documentação
- style: para formatação
- test: para testes
- chore: para manutenção

A mensagem deve ter no máximo 2 linhas: um título curto e opcionalmente uma descrição breve.

Diff:
\`\`\`diff
${diff.substring(0, 4000)}
\`\`\`

Responda APENAS com a mensagem de commit, sem explicações adicionais.`;
            const result = await this.executePromptRealtime(id, prompt);
            if (result.success && result.output) {
                let message = result.output
                    .replace(/```[\s\S]*?```/g, '')
                    .replace(/^.*?:/, (match) => match)
                    .trim();
                const lines = message.split('\n').filter(l => l.trim());
                if (lines.length > 2) {
                    message = lines.slice(0, 2).join('\n');
                }
                return { message };
            }
            return { message: 'Erro ao gerar mensagem de commit' };
        }
        catch (error) {
            console.error('❌ Erro ao gerar mensagem de commit:', error);
            throw new common_1.ConflictException(`Erro ao gerar mensagem: ${error.message}`);
        }
    }
};
exports.ProjectsService = ProjectsService;
exports.ProjectsService = ProjectsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(project_entity_1.Project)),
    __param(1, (0, typeorm_1.InjectRepository)(preset_entity_1.Preset)),
    __param(2, (0, typeorm_1.InjectRepository)(job_queue_entity_1.JobQueue)),
    __param(3, (0, typeorm_1.InjectRepository)(job_execution_entity_1.JobExecution)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        logs_service_1.LogsService,
        chat_service_1.ChatService])
], ProjectsService);
//# sourceMappingURL=projects.service.js.map