import { ScriptExecutionContext, JobExecutionResult } from '../types/job-queue.types';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Handler de Prompts de IA com Claude CLI
 * Processa prompts do usuário e executa Claude Code CLI no diretório do projeto
 */

interface AIPromptMetadata {
  type: 'ai-prompt';
  projectId: string;
  projectAlias: string;
  userPrompt: string;
  executionMode: 'realtime' | 'queue';
}

export async function execute(context: ScriptExecutionContext): Promise<JobExecutionResult> {
  const startTime = Date.now();

  try {
    const { environmentVars } = context;

    const projectId = environmentVars.PROJECT_ID;
    const projectName = environmentVars.PROJECT_NAME;
    const projectAlias = environmentVars.PROJECT_ALIAS;
    const userPrompt = environmentVars.USER_PROMPT;
    const promptTemplate = environmentVars.PROMPT_TEMPLATE || '';

    console.log('🤖 AI Prompt Handler iniciado');
    console.log(`📁 Projeto: ${projectName}`);
    console.log(`💬 Prompt: ${userPrompt.substring(0, 100)}...`);

    if (!userPrompt || userPrompt.trim().length === 0) {
      return {
        success: false,
        output: '',
        error: 'Prompt vazio',
        executionTimeMs: Date.now() - startTime,
      };
    }

    let output = '';
    output += `╭─────────────────────────────────────────────╮\n`;
    output += `│   🤖 Claude AI - NetPilot                  │\n`;
    output += `╰─────────────────────────────────────────────╯\n\n`;

    output += `📁 Projeto: ${projectName}\n`;
    output += `👤 Alias: ${projectAlias}\n\n`;

    // Verificar Claude CLI
    output += `🔍 Verificando Claude CLI...\n`;
    try {
      const { stdout } = await execAsync('claude --version 2>&1 || echo "not_found"');
      if (stdout.includes('not_found')) {
        output += `📦 Instalando @anthropic-ai/claude-code...\n`;
        await execAsync('npm install -g @anthropic-ai/claude-code', { timeout: 120000 });
        output += `✅ Claude CLI instalado!\n\n`;
      } else {
        output += `✅ Claude CLI: ${stdout.trim()}\n\n`;
      }
    } catch (err) {
      output += `⚠️ Erro: ${err.message}\n`;
    }

    const fs = require('fs');
    const isDocker = fs.existsSync('/host/home');
    const projectPath = isDocker ? `/host/home/${projectAlias}/code` : `/home/${projectAlias}/code`;
    const contextsPath = isDocker ? `/host/home/${projectAlias}/contexts` : `/home/${projectAlias}/contexts`;

    output += `🚀 Executando no diretório: ${projectPath}\n\n`;

    if (!fs.existsSync(projectPath)) {
      return {
        success: false,
        output: output + `❌ Diretório não encontrado: ${projectPath}`,
        error: 'Diretório não existe',
        executionTimeMs: Date.now() - startTime,
      };
    }

    // Carregar contextos
    output += `📋 Carregando contextos...\n`;
    const contextInfo = await loadContexts(contextsPath);

    if (contextInfo.totalFiles > 0) {
      output += `✅ ${contextInfo.totalFiles} arquivo(s) de contexto encontrado(s)\n`;
      output += `   Personas: ${contextInfo.personas.length}\n`;
      output += `   Configs: ${contextInfo.configs.length}\n`;
      output += `   Docker: ${contextInfo.docker.length}\n`;
      output += `   Scripts: ${contextInfo.scripts.length}\n`;
      output += `   Templates: ${contextInfo.templates.length}\n\n`;
    } else {
      output += `⚠️ Nenhum contexto encontrado\n\n`;
    }

    // Construir prompt completo com contextos
    let finalPrompt = '';

    // 1. Adicionar personas
    if (contextInfo.personas.length > 0) {
      finalPrompt += `# 📋 CONTEXTO - Personas\n\n`;
      for (const persona of contextInfo.personas) {
        finalPrompt += `## ${persona.name}\n\n`;
        finalPrompt += `${persona.content}\n\n`;
      }
      finalPrompt += `---\n\n`;
    }

    // 2. Adicionar informações sobre configs disponíveis
    if (contextInfo.configs.length > 0) {
      finalPrompt += `# 📋 CONTEXTO - Arquivos de Configuração Disponíveis\n\n`;
      finalPrompt += `Os seguintes arquivos de configuração estão disponíveis no projeto:\n\n`;
      for (const config of contextInfo.configs) {
        finalPrompt += `- ${config.name}\n`;
      }
      finalPrompt += `\n---\n\n`;
    }

    // 3. Adicionar informações sobre docker compose
    if (contextInfo.docker.length > 0) {
      finalPrompt += `# 📋 CONTEXTO - Docker Compose\n\n`;
      finalPrompt += `Os seguintes arquivos Docker estão configurados:\n\n`;
      for (const docker of contextInfo.docker) {
        finalPrompt += `- ${docker.name}\n`;
      }
      finalPrompt += `\n---\n\n`;
    }

    // 4. Adicionar template padrão
    if (promptTemplate && promptTemplate.trim()) {
      finalPrompt += `# 📋 INSTRUÇÕES PADRÃO DO PROJETO\n\n`;
      finalPrompt += `${promptTemplate}\n\n`;
      finalPrompt += `---\n\n`;
    }

    // 5. Adicionar prompt do usuário
    finalPrompt += `# 📋 TAREFA\n\n`;
    finalPrompt += `${userPrompt}`;

    const escaped = finalPrompt.replace(/"/g, '\\"').replace(/\$/g, '\\$');

    try {
      const { stdout: result, stderr: errors } = await execAsync(
        `cd ${projectPath} && claude "${escaped}"`,
        { timeout: 300000, maxBuffer: 10 * 1024 * 1024 }
      );

      output += `✨ Claude Response:\n`;
      output += `─────────────────────────────────────────────\n`;
      output += result || 'Sem saída';
      if (errors) output += `\n\n⚠️ ${errors}`;
      
      output += `\n\n✅ Concluído (${Date.now() - startTime}ms)\n`;

      return {
        success: true,
        output,
        error: '',
        executionTimeMs: Date.now() - startTime,
      };
    } catch (err) {
      output += `❌ Erro: ${err.message}\n`;
      if (err.stdout) output += `\n${err.stdout}`;
      if (err.stderr) output += `\n${err.stderr}`;

      return {
        success: false,
        output,
        error: err.message,
        executionTimeMs: Date.now() - startTime,
      };
    }
  } catch (error) {
    return {
      success: false,
      output: '',
      error: error.message,
      executionTimeMs: Date.now() - startTime,
    };
  }
}

/**
 * Carrega arquivos de contexto do diretório contexts
 */
async function loadContexts(contextsPath: string) {
  const fs = require('fs');
  const fsPromises = require('fs').promises;
  const path = require('path');

  const result = {
    personas: [],
    configs: [],
    docker: [],
    scripts: [],
    templates: [],
    totalFiles: 0
  };

  // Verificar se diretório contexts existe
  if (!fs.existsSync(contextsPath)) {
    return result;
  }

  try {
    // Carregar personas
    const personasPath = path.join(contextsPath, 'personas');
    if (fs.existsSync(personasPath)) {
      const files = await fsPromises.readdir(personasPath);
      for (const file of files) {
        const content = await fsPromises.readFile(path.join(personasPath, file), 'utf-8');
        result.personas.push({ name: file, content });
        result.totalFiles++;
      }
    }

    // Carregar configs (apenas listar, não ler conteúdo completo)
    const configsPath = path.join(contextsPath, 'configs');
    if (fs.existsSync(configsPath)) {
      const files = await fsPromises.readdir(configsPath);
      for (const file of files) {
        result.configs.push({ name: file });
        result.totalFiles++;
      }
    }

    // Carregar docker compose (apenas listar)
    const dockerPath = path.join(contextsPath, 'docker');
    if (fs.existsSync(dockerPath)) {
      const files = await fsPromises.readdir(dockerPath);
      for (const file of files) {
        result.docker.push({ name: file });
        result.totalFiles++;
      }
    }

    // Carregar scripts (apenas listar)
    const scriptsPath = path.join(contextsPath, 'scripts');
    if (fs.existsSync(scriptsPath)) {
      const files = await fsPromises.readdir(scriptsPath);
      for (const file of files) {
        result.scripts.push({ name: file });
        result.totalFiles++;
      }
    }

    // Carregar templates (apenas listar)
    const templatesPath = path.join(contextsPath, 'templates');
    if (fs.existsSync(templatesPath)) {
      const files = await fsPromises.readdir(templatesPath);
      for (const file of files) {
        result.templates.push({ name: file });
        result.totalFiles++;
      }
    }
  } catch (error) {
    console.error('Erro ao carregar contextos:', error);
  }

  return result;
}

export default execute;
