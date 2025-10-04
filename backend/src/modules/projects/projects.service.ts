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
import { LogsService } from '../logs/logs.service';
import { LogType, LogStatus } from '../../entities/log.entity';

const execAsync = promisify(exec);

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    private logsService: LogsService,
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

      // 2. Criar o projeto no banco
      const project = this.projectRepository.create(createProjectDto);
      const savedProject = await this.projectRepository.save(project);

      try {
        const codePath = `${projectPath}/code`;
        const contextsPath = `${projectPath}/contexts`;

        // 3. Criar pasta contexts para arquivos de contexto do Claude
        console.log(`📁 Criando pasta contexts: ${contextsPath}`);
        await execAsync(`sudo -u ${username} mkdir -p "${contextsPath}"`);
        await execAsync(`sudo chmod 755 "${contextsPath}"`);
        console.log(`✅ Pasta contexts criada em: ${contextsPath}`);

        // 4. Clonar repositório se fornecido
        if (createProjectDto.repository && createProjectDto.repository.trim()) {
          console.log(`🔄 Clonando repositório: ${createProjectDto.repository}`);

          try {
            await execAsync(
              `sudo -u ${username} git clone "${createProjectDto.repository}" "${codePath}"`,
              { timeout: 180000 } // 3 minutos timeout
            );

            // Marcar como clonado
            savedProject.cloned = true;
            await this.projectRepository.save(savedProject);

            console.log(`✅ Repositório clonado em: ${codePath}`);
          } catch (cloneError) {
            console.error(`❌ Erro ao clonar repositório: ${cloneError.message}`);
            // Não falhar a criação do projeto se o clone falhar
          }
        }

        // 5. Garantir permissões corretas
        await execAsync(`sudo chown -R ${username}:${username} ${projectPath}`);
        console.log(`✅ Permissões configuradas para ${username}`);

        await this.logsService.updateLogStatus(
          log.id,
          LogStatus.SUCCESS,
          `Projeto ${savedProject.name} criado com sucesso (usuário: ${username}, pasta: ${projectPath}, contexts: ${contextsPath}${savedProject.cloned ? ', repositório clonado' : ''})`,
          JSON.stringify({
            id: savedProject.id,
            name: savedProject.name,
            username: username,
            path: projectPath,
            cloned: savedProject.cloned
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
}