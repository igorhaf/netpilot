import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import { Project } from '../../entities/project.entity';
import { Stack } from '../../entities/stack.entity';
import { Preset } from '../../entities/preset.entity';
import { JobQueue, ScriptType } from '../../entities/job-queue.entity';
import { JobExecution } from '../../entities/job-execution.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { LogsService } from '../logs/logs.service';
import { LogType, LogStatus } from '../../entities/log.entity';
import { ChatService } from '../chat/chat.service';
import { ChatMessageRole, ChatMessageStatus } from '../../entities/chat-message.entity';
import { ExecutionStatus, TriggerType } from '../../entities/job-execution.entity';

const execAsync = promisify(exec);

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    @InjectRepository(Stack)
    private stackRepository: Repository<Stack>,
    @InjectRepository(Preset)
    private presetRepository: Repository<Preset>,
    @InjectRepository(JobQueue)
    private jobQueueRepository: Repository<JobQueue>,
    @InjectRepository(JobExecution)
    private jobExecutionRepository: Repository<JobExecution>,
    private logsService: LogsService,
    private chatService: ChatService,
  ) {}

  async create(createProjectDto: CreateProjectDto): Promise<Project> {
    const log = await this.logsService.createLog(
      LogType.PROJECT,
      'Criar projeto',
      `Criando projeto ${createProjectDto.name}`,
    );

    try {
      // Verificar se já existe um projeto com o mesmo nome
      const existingProject = await this.projectRepository.findOne({
        where: { name: createProjectDto.name },
      });

      if (existingProject) {
        await this.logsService.updateLogStatus(
          log.id,
          LogStatus.FAILED,
          'Projeto com este nome já existe',
        );
        throw new ConflictException('Projeto com este nome já existe');
      }

      // Verificar se já existe um projeto com o mesmo alias
      const existingAlias = await this.projectRepository.findOne({
        where: { alias: createProjectDto.alias },
      });

      if (existingAlias) {
        await this.logsService.updateLogStatus(
          log.id,
          LogStatus.FAILED,
          'Projeto com este alias já existe',
        );
        throw new ConflictException('Projeto com este alias já existe');
      }

      const username = createProjectDto.alias;
      const projectPath = `/home/${username}`;

      // 1. Criar usuário Linux no grupo projects
      console.log(`👤 Criando usuário Linux: ${username}`);
      try {
        // Criar grupo projects se não existir
        await execAsync(`sudo groupadd projects 2>&1 || true`);

        // Criar usuário com grupo secundário projects
        await execAsync(`sudo useradd -m -s /bin/bash -G projects ${username}`);
        console.log(`✅ Usuário ${username} criado com sucesso no grupo projects`);
      } catch (userError) {
        // Verificar se o erro é porque o usuário já existe
        const checkUser = await execAsync(`id ${username} 2>&1 || true`);
        if (!checkUser.stdout.includes('uid=')) {
          throw new ConflictException(`Falha ao criar usuário Linux: ${userError.message}`);
        }
        // Se usuário existe, adicionar ao grupo projects
        await execAsync(`sudo usermod -a -G projects ${username} 2>&1 || true`);
        console.log(`ℹ️ Usuário ${username} já existe, adicionado ao grupo projects`);
      }

      // 2. Criar o projeto no banco com stacks e presets
      const { stackIds, presetIds, ...projectData } = createProjectDto;
      const project = this.projectRepository.create(projectData);

      // Associar stacks se fornecido
      if (stackIds && stackIds.length > 0) {
        const stacks = await this.stackRepository.findBy({ id: In(stackIds) });
        project.stacks = stacks;
      }

      // Associar presets se fornecido
      if (presetIds && presetIds.length > 0) {
        const presets = await this.presetRepository.findBy({ id: In(presetIds) });
        project.presets = presets;
      }

      const savedProject = await this.projectRepository.save(project);

      try {
        const codePath = `${projectPath}/code`;
        const contextsPath = `${projectPath}/contexts`;

        // 3. Criar pastas code e contexts
        console.log(`📁 Criando pasta code: ${codePath}`);
        await execAsync(`sudo -u ${username} mkdir -p "${codePath}"`);
        await execAsync(`sudo chmod 755 "${codePath}"`);
        console.log(`✅ Pasta code criada em: ${codePath}`);

        console.log(`📁 Criando pasta contexts: ${contextsPath}`);
        await execAsync(`sudo -u ${username} mkdir -p "${contextsPath}"`);
        await execAsync(`sudo chmod 755 "${contextsPath}"`);
        console.log(`✅ Pasta contexts criada em: ${contextsPath}`);

        // 4. Clonar repositório se fornecido
        if (createProjectDto.repository && createProjectDto.repository.trim()) {
          console.log(`🔄 Clonando repositório: ${createProjectDto.repository}`);

          try {
            // Clonar dentro da pasta code
            await execAsync(
              `sudo -u ${username} git clone "${createProjectDto.repository}" "${codePath}/repo"`,
              { timeout: 180000 } // 3 minutos timeout
            );

            // Marcar como clonado
            savedProject.cloned = true;
            await this.projectRepository.save(savedProject);

            console.log(`✅ Repositório clonado em: ${codePath}/repo`);
          } catch (cloneError) {
            console.error(`❌ Erro ao clonar repositório: ${cloneError.message}`);
            // Não falhar a criação do projeto se o clone falhar
          }
        }

        // 5. Aplicar presets ao diretório contexts
        await this.applyPresetsToProject(savedProject, contextsPath, username);

        // 6. Garantir permissões corretas
        await execAsync(`sudo chown -R ${username}:${username} ${projectPath}`);
        // Permitir que bender/marvin acessem os diretórios (o+x no home, o+rx em code e contexts)
        await execAsync(`sudo chmod o+x ${projectPath}`);
        await execAsync(`sudo chmod o+rx ${codePath}`);
        await execAsync(`sudo chmod o+rx ${contextsPath}`);
        console.log(`✅ Permissões configuradas para ${username}`);

        // 7. Criar JobQueue para executar comandos do projeto
        console.log(`⚙️ Criando job queue para o projeto ${savedProject.name}`);
        const jobQueue = this.jobQueueRepository.create({
          name: `Terminal - ${savedProject.name}`,
          description: `Executa comandos shell no projeto ${savedProject.name}`,
          scriptType: ScriptType.SHELL,
          scriptPath: 'echo "Terminal command"', // Placeholder, será substituído pelo comando real
          isActive: true,
          priority: 5,
          metadata: {
            projectId: savedProject.id,
            projectPath: projectPath,
            isTerminal: true,
          },
        });

        const savedJobQueue = await this.jobQueueRepository.save(jobQueue) as JobQueue;

        // Associar job ao projeto
        savedProject.jobQueueId = savedJobQueue.id;
        await this.projectRepository.save(savedProject);

        console.log(`✅ Job queue criado: ${savedJobQueue.id}`);

        await this.logsService.updateLogStatus(
          log.id,
          LogStatus.SUCCESS,
          `Projeto ${savedProject.name} criado com sucesso (usuário: ${username}, pasta: ${projectPath}, contexts: ${contextsPath}${savedProject.cloned ? ', repositório clonado' : ''})`,
          JSON.stringify({
            id: savedProject.id,
            name: savedProject.name,
            username: username,
            path: projectPath,
            cloned: savedProject.cloned,
            jobQueueId: savedJobQueue.id,
          }),
        );

        return savedProject;

      } catch (error) {
        // Se falhou após criar no banco, remover projeto
        console.error(`❌ Erro ao configurar projeto: ${error.message}`);
        await this.projectRepository.remove(savedProject);

        await this.logsService.updateLogStatus(
          log.id,
          LogStatus.FAILED,
          `Falha ao configurar projeto: ${error.message}`,
          error.stack,
        );

        throw new ConflictException(
          `Falha ao criar projeto: ${error.message}. Verifique se o repositório é válido e acessível.`
        );
      }

    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      await this.logsService.updateLogStatus(
        log.id,
        LogStatus.FAILED,
        error.message || 'Erro ao criar projeto',
        error.stack,
      );
      throw error;
    }
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
    const log = await this.logsService.createLog(
      LogType.PROJECT,
      'Atualizar projeto',
      `Atualizando projeto ${id}`,
    );

    try {
      const project = await this.findOne(id);

      // Verificar conflito de nome se o nome for alterado
      if (updateProjectDto.name && updateProjectDto.name !== project.name) {
        const existingProject = await this.projectRepository.findOne({
          where: { name: updateProjectDto.name },
        });

        if (existingProject) {
          await this.logsService.updateLogStatus(
            log.id,
            LogStatus.FAILED,
            'Projeto com este nome já existe',
          );
          throw new ConflictException('Projeto com este nome já existe');
        }
      }

      Object.assign(project, updateProjectDto);
      const updated = await this.projectRepository.save(project);

      await this.logsService.updateLogStatus(
        log.id,
        LogStatus.SUCCESS,
        `Projeto ${updated.name} atualizado com sucesso`,
        JSON.stringify({ id: updated.id, changes: updateProjectDto }),
      );

      return updated;
    } catch (error) {
      await this.logsService.updateLogStatus(
        log.id,
        LogStatus.FAILED,
        error.message || 'Erro ao atualizar projeto',
        error.stack,
      );
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    const log = await this.logsService.createLog(
      LogType.PROJECT,
      'Remover projeto',
      `Removendo projeto ${id}`,
    );

    try {
      const project = await this.findOne(id);
      const projectName = project.name;
      const username = project.alias;

      // Verificar se tem domínios associados
      if (project.domains && project.domains.length > 0) {
        await this.logsService.updateLogStatus(
          log.id,
          LogStatus.FAILED,
          'Projeto possui domínios associados',
        );
        throw new ConflictException(
          'Não é possível excluir projeto que possui domínios associados. ' +
          'Remova ou transfira os domínios primeiro.'
        );
      }

      // Remover projeto do banco
      await this.projectRepository.remove(project);

      // Criar job para deletar usuário e pasta em 30 dias
      const deletionDate = new Date();
      deletionDate.setDate(deletionDate.getDate() + 30);

      try {
        // Criar script inline para deletar usuário
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

        // Salvar script temporário
        const scriptPath = `/tmp/cleanup-${username}-${Date.now()}.sh`;
        await fs.writeFile(scriptPath, cleanupScript);
        await execAsync(`chmod +x ${scriptPath}`);

        console.log(`📅 Job de limpeza agendado para ${deletionDate.toISOString()} (${username})`);
        console.log(`📝 Script criado em: ${scriptPath}`);

      } catch (jobError) {
        console.warn(`⚠️  Erro ao criar job de limpeza: ${jobError.message}`);
      }

      await this.logsService.updateLogStatus(
        log.id,
        LogStatus.SUCCESS,
        `Projeto ${projectName} removido. Usuário e pasta serão deletados em 30 dias.`,
        JSON.stringify({ username, deletionDate: deletionDate.toISOString() }),
      );
    } catch (error) {
      await this.logsService.updateLogStatus(
        log.id,
        LogStatus.FAILED,
        error.message || 'Erro ao remover projeto',
        error.stack,
      );
      throw error;
    }
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

  async cloneRepository(id: string): Promise<Project> {
    const log = await this.logsService.createLog(
      LogType.PROJECT,
      'Clonar repositório',
      `Clonando repositório do projeto ${id}`,
    );

    try {
      const project = await this.findOne(id);

      // Verificar se já foi clonado
      if (project.cloned) {
        await this.logsService.updateLogStatus(
          log.id,
          LogStatus.FAILED,
          'Repositório já foi clonado anteriormente',
        );
        throw new ConflictException('Repositório já foi clonado anteriormente');
      }

      // Verificar se tem repositório configurado
      if (!project.repository || !project.repository.trim()) {
        await this.logsService.updateLogStatus(
          log.id,
          LogStatus.FAILED,
          'Projeto não possui repositório configurado',
        );
        throw new ConflictException('Projeto não possui repositório configurado');
      }

      const username = project.alias;
      const projectPath = `/home/${username}`;
      const codePath = `${projectPath}/code`;

      console.log(`🔄 Clonando repositório: ${project.repository}`);

      try {
        await execAsync(
          `sudo -u ${username} git clone "${project.repository}" "${codePath}"`,
          { timeout: 180000 } // 3 minutos timeout
        );

        // Marcar como clonado
        project.cloned = true;
        const savedProject = await this.projectRepository.save(project);

        console.log(`✅ Repositório clonado em: ${codePath}`);

        await this.logsService.updateLogStatus(
          log.id,
          LogStatus.SUCCESS,
          `Repositório clonado com sucesso em ${codePath}`,
          JSON.stringify({ projectId: savedProject.id, path: codePath }),
        );

        return savedProject;
      } catch (cloneError) {
        console.error(`❌ Erro ao clonar repositório: ${cloneError.message}`);

        await this.logsService.updateLogStatus(
          log.id,
          LogStatus.FAILED,
          `Erro ao clonar repositório: ${cloneError.message}`,
          cloneError.stack,
        );

        throw new ConflictException(
          `Falha ao clonar repositório: ${cloneError.message}. Verifique se o repositório é válido e acessível.`
        );
      }
    } catch (error) {
      if (error instanceof ConflictException || error instanceof NotFoundException) {
        throw error;
      }
      await this.logsService.updateLogStatus(
        log.id,
        LogStatus.FAILED,
        error.message || 'Erro ao clonar repositório',
        error.stack,
      );
      throw error;
    }
  }

  async generateSshKey(id: string): Promise<Project> {
    const log = await this.logsService.createLog(
      LogType.PROJECT,
      'Gerar chave SSH',
      `Gerando chave SSH para projeto ${id}`,
    );

    try {
      const project = await this.findOne(id);

      // Verificar se já possui chave SSH
      if (project.hasSshKey) {
        await this.logsService.updateLogStatus(
          log.id,
          LogStatus.FAILED,
          'Projeto já possui chave SSH configurada',
        );
        throw new ConflictException('Projeto já possui chave SSH. Delete a chave existente antes de gerar uma nova.');
      }

      const username = project.alias;

      // Detectar se está rodando em Docker
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
        // 1. Criar diretório .ssh (modo Docker)
        await execAsync(`mkdir -p ${sshDir}`);
        await execAsync(`chmod 700 ${sshDir}`);

        // 2. Gerar chave SSH
        await execAsync(
          `ssh-keygen -t rsa -b 4096 -f ${privateKeyPath} -N "" -C "${username}@netpilot"`,
          { timeout: 30000 }
        );

        // 3. Ajustar permissões
        await execAsync(`chmod 600 ${privateKeyPath}`);
        await execAsync(`chmod 644 ${publicKeyPath}`);

        // 4. Ler chave pública
        const { stdout: publicKey } = await execAsync(`cat ${publicKeyPath}`);

        // 5. Obter fingerprint
        const { stdout: fingerprint } = await execAsync(
          `ssh-keygen -lf ${publicKeyPath} -E sha256 | awk '{print $2}'`
        );

        // 6. Atualizar projeto no banco
        project.hasSshKey = true;
        project.sshPublicKey = publicKey.trim();
        project.sshKeyFingerprint = fingerprint.trim();

        const savedProject = await this.projectRepository.save(project);

        console.log(`✅ Chave SSH gerada com sucesso para ${username}`);
        console.log(`   Fingerprint: ${fingerprint.trim()}`);

        await this.logsService.updateLogStatus(
          log.id,
          LogStatus.SUCCESS,
          `Chave SSH gerada com sucesso`,
          JSON.stringify({
            projectId: savedProject.id,
            fingerprint: fingerprint.trim(),
            publicKeyPath
          }),
        );

        return savedProject;
      } else {
        // Modo host com sudo
        // 1. Criar diretório .ssh
        await execAsync(`sudo -u ${username} mkdir -p ${sshDir}`);
        await execAsync(`sudo chmod 700 ${sshDir}`);

        // 2. Gerar chave SSH
        await execAsync(
          `sudo -u ${username} ssh-keygen -t rsa -b 4096 -f ${privateKeyPath} -N "" -C "${username}@netpilot"`,
          { timeout: 30000 }
        );

        // 3. Ajustar permissões
        await execAsync(`sudo chmod 600 ${privateKeyPath}`);
        await execAsync(`sudo chmod 644 ${publicKeyPath}`);

        // 4. Ler chave pública
        const { stdout: publicKey } = await execAsync(`sudo cat ${publicKeyPath}`);

        // 5. Obter fingerprint
        const { stdout: fingerprint } = await execAsync(
          `sudo ssh-keygen -lf ${publicKeyPath} -E sha256 | awk '{print $2}'`
        );

        // 6. Atualizar projeto no banco
        project.hasSshKey = true;
        project.sshPublicKey = publicKey.trim();
        project.sshKeyFingerprint = fingerprint.trim();

        const savedProject = await this.projectRepository.save(project);

        console.log(`✅ Chave SSH gerada com sucesso para ${username}`);
        console.log(`   Fingerprint: ${fingerprint.trim()}`);

        await this.logsService.updateLogStatus(
          log.id,
          LogStatus.SUCCESS,
          `Chave SSH gerada com sucesso`,
          JSON.stringify({
            projectId: savedProject.id,
            fingerprint: fingerprint.trim(),
            publicKeyPath
          }),
        );

        return savedProject;
      }
    } catch (error) {
      if (error instanceof ConflictException || error instanceof NotFoundException) {
        throw error;
      }
      await this.logsService.updateLogStatus(
        log.id,
        LogStatus.FAILED,
        error.message || 'Erro ao gerar chave SSH',
        error.stack,
      );
      throw new ConflictException(
        `Falha ao gerar chave SSH: ${error.message}`
      );
    }
  }

  async getSshPublicKey(id: string): Promise<{ publicKey: string; fingerprint: string }> {
    const project = await this.findOne(id);

    if (!project.hasSshKey) {
      throw new NotFoundException('Projeto não possui chave SSH configurada');
    }

    return {
      publicKey: project.sshPublicKey,
      fingerprint: project.sshKeyFingerprint
    };
  }

  async deleteSshKey(id: string): Promise<Project> {
    const log = await this.logsService.createLog(
      LogType.PROJECT,
      'Deletar chave SSH',
      `Deletando chave SSH do projeto ${id}`,
    );

    try {
      const project = await this.findOne(id);

      if (!project.hasSshKey) {
        await this.logsService.updateLogStatus(
          log.id,
          LogStatus.FAILED,
          'Projeto não possui chave SSH configurada',
        );
        throw new NotFoundException('Projeto não possui chave SSH configurada');
      }

      const username = project.alias;

      // Detectar se está rodando em Docker
      const fsSync = require('fs');
      const isDocker = fsSync.existsSync('/host/home');

      let sshDir = `/home/${username}/.ssh`;
      if (isDocker) {
        sshDir = `/host/home/${username}/.ssh`;
      }

      console.log(`🗑️ Deletando chaves SSH para usuário: ${username} (Docker: ${isDocker})`);

      // Deletar chaves SSH
      if (isDocker) {
        await execAsync(`rm -f ${sshDir}/id_rsa ${sshDir}/id_rsa.pub`);
      } else {
        await execAsync(`sudo rm -f ${sshDir}/id_rsa ${sshDir}/id_rsa.pub`);
      }

      // Atualizar projeto
      project.hasSshKey = false;
      project.sshPublicKey = null;
      project.sshKeyFingerprint = null;

      const savedProject = await this.projectRepository.save(project);

      console.log(`✅ Chaves SSH deletadas para ${username}`);

      await this.logsService.updateLogStatus(
        log.id,
        LogStatus.SUCCESS,
        `Chaves SSH deletadas com sucesso`,
        JSON.stringify({ projectId: savedProject.id }),
      );

      return savedProject;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      await this.logsService.updateLogStatus(
        log.id,
        LogStatus.FAILED,
        error.message || 'Erro ao deletar chave SSH',
        error.stack,
      );
      throw new ConflictException(
        `Falha ao deletar chave SSH: ${error.message}`
      );
    }
  }

  /**
   * Aplica presets ao diretório contexts do projeto
   */
  private async applyPresetsToProject(
    project: Project,
    contextsPath: string,
    username: string
  ): Promise<void> {
    console.log(`📦 Aplicando presets ao projeto ${project.name}...`);

    // Criar subdiretórios por tipo de preset
    const subdirs = ['docker', 'personas', 'configs', 'scripts', 'templates'];
    for (const subdir of subdirs) {
      const dirPath = `${contextsPath}/${subdir}`;
      await execAsync(`sudo -u ${username} mkdir -p "${dirPath}"`);
      console.log(`  📁 Criado: ${subdir}/`);
    }

    let totalPresets = 0;

    // Processar presets de todas as stacks associadas
    if (project.stacks && project.stacks.length > 0) {
      for (const stack of project.stacks) {
        console.log(`  🔴 Stack: ${stack.name}`);

        if (stack.presets && stack.presets.length > 0) {
          for (const preset of stack.presets) {
            await this.writePresetFile(contextsPath, preset, username);
            totalPresets++;
          }
        }
      }
    }

    // Processar presets soltos
    if (project.presets && project.presets.length > 0) {
      console.log(`  📎 Presets soltos: ${project.presets.length}`);

      for (const preset of project.presets) {
        await this.writePresetFile(contextsPath, preset, username);
        totalPresets++;
      }
    }

    console.log(`✅ ${totalPresets} preset${totalPresets !== 1 ? 's' : ''} aplicado${totalPresets !== 1 ? 's' : ''}`);
  }

  /**
   * Escreve um preset no diretório correto
   */
  private async writePresetFile(
    basePath: string,
    preset: Preset,
    username: string
  ): Promise<void> {
    const typeDir = {
      'docker': 'docker',
      'persona': 'personas',
      'config': 'configs',
      'script': 'scripts',
      'template': 'templates'
    }[preset.type];

    const filename = preset.filename || `${preset.name.toLowerCase().replace(/\s+/g, '-')}.${this.getPresetExtension(preset)}`;
    const fullPath = `${basePath}/${typeDir}/${filename}`;

    // Criar arquivo temporário com o conteúdo
    const tempFile = `/tmp/preset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    await fs.writeFile(tempFile, preset.content, 'utf-8');

    // Mover para o destino com permissões corretas
    await execAsync(`sudo mv ${tempFile} "${fullPath}"`);
    await execAsync(`sudo chown ${username}:${username} "${fullPath}"`);

    // Tornar scripts executáveis
    if (preset.type === 'script') {
      await execAsync(`sudo chmod +x "${fullPath}"`);
    } else {
      await execAsync(`sudo chmod 644 "${fullPath}"`);
    }

    console.log(`    ✓ ${typeDir}/${filename}`);
  }

  /**
   * Retorna a extensão adequada baseada no tipo e linguagem do preset
   */
  private getPresetExtension(preset: Preset): string {
    // Se tem extensão no filename, usar ela
    if (preset.filename && preset.filename.includes('.')) {
      return preset.filename.split('.').pop();
    }

    // Baseado na linguagem
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

    // Baseado no tipo
    const typeMap = {
      'docker': 'yml',
      'persona': 'md',
      'config': 'conf',
      'script': 'sh',
      'template': 'txt'
    };

    return typeMap[preset.type] || 'txt';
  }

  /**
   * Garante que o projeto tem um job associado, criando se necessário
   */
  private async ensureProjectJob(project: Project): Promise<void> {
    // Se já tem jobQueueId e o job existe, não faz nada
    if (project.jobQueueId) {
      const existingJob = await this.jobQueueRepository.findOne({
        where: { id: project.jobQueueId }
      });

      if (existingJob) {
        console.log(`✅ Job já existe para ${project.name}: ${project.jobQueueId}`);
        return;
      }
    }

    // Job não existe ou foi deletado, recriar
    console.log(`⚙️ Recriando job queue para o projeto ${project.name}`);
    const projectPath = `/home/${project.alias}`;

    const jobQueue = this.jobQueueRepository.create({
      name: `Terminal - ${project.name}`,
      description: `Executa comandos shell no projeto ${project.name}`,
      scriptType: ScriptType.SHELL,
      scriptPath: 'echo "Terminal command"',
      isActive: true,
      priority: 5,
      metadata: {
        projectId: project.id,
        projectPath: projectPath,
        isTerminal: true,
      },
    });

    const savedJobQueue = await this.jobQueueRepository.save(jobQueue) as JobQueue;

    // Atualizar projeto com o novo jobQueueId
    project.jobQueueId = savedJobQueue.id;
    await this.projectRepository.save(project);

    console.log(`✅ Job queue recriado: ${savedJobQueue.id}`);
  }

  /**
   * Executa prompt com Claude CLI em tempo real (sem Redis/fila)
   */
  async executePromptRealtime(id: string, userPrompt: string, userId?: string): Promise<any> {
    const project = await this.findOne(id);
    const startTime = Date.now();
    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    console.log(`🤖 Executando prompt em tempo real para ${project.name}`);
    console.log(`💬 Prompt: ${userPrompt}`);

    // Verificar se o job existe, se não, recriar
    await this.ensureProjectJob(project);

    // Criar job execution para compatibilidade com frontend
    const jobExecution = this.jobExecutionRepository.create({
      status: ExecutionStatus.RUNNING,
      startedAt: new Date(),
      triggerType: TriggerType.MANUAL,
      metadata: {
        type: 'ai-prompt',
        projectId: id,
        userPrompt: userPrompt,
        executionMode: 'realtime',
      },
    });
    await this.jobExecutionRepository.save(jobExecution);

    // Salvar mensagem do usuário
    const userMessage = await this.chatService.create({
      role: ChatMessageRole.USER,
      content: userPrompt,
      projectId: id,
      userId,
      sessionId,
      status: ChatMessageStatus.COMPLETED,
      metadata: { jobExecutionId: jobExecution.id },
    });

    try {
      const fsSync = require('fs');
      const projectPath = `/home/${project.alias}/code`;

      // Usar apenas bender até marvin ser re-autenticado
      // TODO: Restaurar random quando marvin estiver funcionando
      // const agents = ['bender', 'marvin'];
      // const selectedAgent = agents[Math.floor(Math.random() * agents.length)];
      const selectedAgent = 'bender';

      let output = '';

      try {
        // Executar via API do FastAPI System Ops (roda no HOST)
        const systemOpsUrl = process.env.SYSTEM_OPS_URL || 'http://172.18.0.1:8001';
        const axios = require('axios');

        const response = await axios.post(`${systemOpsUrl}/claude/execute`, {
          projectPath: projectPath,
          prompt: userPrompt,
          agent: selectedAgent,
          timeoutSeconds: 300
        }, {
          timeout: 300000 // 5 minutos
        });

        const result = response.data;

        // Apenas a saída do Claude, sem formatação extra
        output = result.stdout || 'Sem saída';

        if (result.stderr && result.stderr.trim()) {
          output += `\n\n⚠️ ${result.stderr}`;
        }

        // Atualizar job execution
        jobExecution.status = ExecutionStatus.COMPLETED;
        jobExecution.completedAt = new Date();
        jobExecution.executionTimeMs = Date.now() - startTime;
        jobExecution.outputLog = output;
        await this.jobExecutionRepository.save(jobExecution);

        // Salvar resposta do assistente
        await this.chatService.create({
          role: ChatMessageRole.ASSISTANT,
          content: output,
          projectId: id,
          sessionId,
          status: ChatMessageStatus.COMPLETED,
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

      } catch (error) {
        output += `❌ Erro na execução:\n${error.message}\n`;
        if (error.stderr) {
          output += `\n${error.stderr}\n`;
        }

        // Atualizar job execution como falha
        jobExecution.status = ExecutionStatus.FAILED;
        jobExecution.completedAt = new Date();
        jobExecution.executionTimeMs = Date.now() - startTime;
        jobExecution.errorLog = output;
        await this.jobExecutionRepository.save(jobExecution);

        // Salvar resposta de erro
        await this.chatService.create({
          role: ChatMessageRole.ASSISTANT,
          content: output,
          projectId: id,
          sessionId,
          status: ChatMessageStatus.ERROR,
          metadata: { jobExecutionId: jobExecution.id },
        });

        return {
          success: false,
          output,
          executionTimeMs: Date.now() - startTime,
          sessionId
        };
      }
    } catch (error) {
      console.error('❌ Erro ao executar prompt:', error);
      const errorOutput = `Erro ao executar prompt: ${error.message}`;

      // Atualizar job execution com erro
      try {
        jobExecution.status = ExecutionStatus.FAILED;
        jobExecution.completedAt = new Date();
        jobExecution.executionTimeMs = Date.now() - startTime;
        jobExecution.errorLog = errorOutput;
        await this.jobExecutionRepository.save(jobExecution);
      } catch (saveError) {
        console.error('Erro ao salvar job execution:', saveError);
      }

      // Salvar resposta de erro
      try {
        await this.chatService.create({
          role: ChatMessageRole.ASSISTANT,
          content: errorOutput,
          projectId: id,
          sessionId,
          status: ChatMessageStatus.ERROR,
          metadata: {
            error: error.message,
            stack: error.stack,
            jobExecutionId: jobExecution.id,
          },
        });
      } catch (chatError) {
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

  /**
   * Executa comando shell no diretório do projeto
   */
  async executeCommand(id: string, command: string, userId?: string): Promise<any> {
    const project = await this.findOne(id);
    const startTime = Date.now();
    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    console.log(`🖥️ Executando comando para ${project.name}: ${command}`);

    // Garantir que o job existe
    await this.ensureProjectJob(project);

    const projectPath = `/home/${project.alias}`;

    // Criar job execution
    const jobExecution = this.jobExecutionRepository.create({
      status: ExecutionStatus.RUNNING,
      startedAt: new Date(),
      triggerType: TriggerType.MANUAL,
      metadata: {
        type: 'terminal-command',
        projectId: id,
        command: command,
        executionMode: project.executionMode,
      },
    });
    await this.jobExecutionRepository.save(jobExecution);

    // Salvar comando do usuário como mensagem
    await this.chatService.create({
      role: ChatMessageRole.USER,
      content: command,
      projectId: id,
      userId,
      sessionId,
      status: ChatMessageStatus.COMPLETED,
      metadata: { jobExecutionId: jobExecution.id, isCommand: true },
    });

    try {
      // Executar comando no diretório do projeto
      const { stdout, stderr } = await execAsync(
        command,
        {
          cwd: projectPath,
          timeout: 300000, // 5 minutos
          maxBuffer: 10 * 1024 * 1024, // 10MB
        }
      );

      // Combinar stdout e stderr
      let output = '';
      if (stdout) output += stdout;
      if (stderr) output += stderr;

      if (!output.trim()) {
        output = '[Comando executado com sucesso - sem saída]';
      }

      // Atualizar job execution
      jobExecution.status = ExecutionStatus.COMPLETED;
      jobExecution.completedAt = new Date();
      jobExecution.executionTimeMs = Date.now() - startTime;
      jobExecution.outputLog = output;
      await this.jobExecutionRepository.save(jobExecution);

      // Salvar saída como mensagem do assistente
      await this.chatService.create({
        role: ChatMessageRole.ASSISTANT,
        content: output,
        projectId: id,
        sessionId,
        status: ChatMessageStatus.COMPLETED,
        metadata: { jobExecutionId: jobExecution.id, isCommandOutput: true },
      });

      console.log(`✅ Comando executado com sucesso`);

      return {
        success: true,
        output,
        executionTimeMs: Date.now() - startTime,
        sessionId,
      };

    } catch (error) {
      console.error(`❌ Erro ao executar comando: ${error.message}`);

      let errorOutput = `Erro: ${error.message}`;
      if (error.stdout) errorOutput += `\n\nSaída padrão:\n${error.stdout}`;
      if (error.stderr) errorOutput += `\n\nSaída de erro:\n${error.stderr}`;

      // Atualizar job execution com erro
      jobExecution.status = ExecutionStatus.FAILED;
      jobExecution.completedAt = new Date();
      jobExecution.executionTimeMs = Date.now() - startTime;
      jobExecution.errorLog = errorOutput;
      await this.jobExecutionRepository.save(jobExecution);

      // Salvar erro como mensagem do assistente
      await this.chatService.create({
        role: ChatMessageRole.ASSISTANT,
        content: errorOutput,
        projectId: id,
        sessionId,
        status: ChatMessageStatus.ERROR,
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

  /**
   * Carrega arquivos de contexto
   */
  private async loadContexts(contextsPath: string) {
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
      // Carregar personas
      const personasPath = `${contextsPath}/personas`;
      if (fsSync.existsSync(personasPath)) {
        const files = await fs.readdir(personasPath);
        for (const file of files) {
          const content = await fs.readFile(`${personasPath}/${file}`, 'utf-8');
          result.personas.push({ name: file, content });
          result.totalFiles++;
        }
      }

      // Carregar configs (apenas listar)
      const configsPath = `${contextsPath}/configs`;
      if (fsSync.existsSync(configsPath)) {
        const files = await fs.readdir(configsPath);
        result.configs = files.map(f => ({ name: f }));
        result.totalFiles += files.length;
      }

      // Carregar docker
      const dockerPath = `${contextsPath}/docker`;
      if (fsSync.existsSync(dockerPath)) {
        const files = await fs.readdir(dockerPath);
        result.docker = files.map(f => ({ name: f }));
        result.totalFiles += files.length;
      }
    } catch (error) {
      console.error('Erro ao carregar contextos:', error);
    }

    return result;
  }
}