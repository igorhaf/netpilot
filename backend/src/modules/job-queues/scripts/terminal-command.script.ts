import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Script para executar comandos shell no diretório de um projeto
 * Metadata esperada:
 * - command: comando a ser executado
 * - projectPath: caminho do diretório do projeto
 * - projectAlias: alias/username do projeto
 */
export async function executeTerminalCommand(metadata: Record<string, any>): Promise<string> {
  const { command, projectPath, projectAlias } = metadata;

  if (!command) {
    throw new Error('Comando não fornecido no metadata');
  }

  if (!projectPath) {
    throw new Error('Caminho do projeto não fornecido no metadata');
  }

  if (!projectAlias) {
    throw new Error('Alias do projeto não fornecido no metadata');
  }

  console.log(`🖥️ Executando comando no projeto ${projectAlias}: ${command}`);
  console.log(`📁 Diretório: ${projectPath}`);

  try {
    // Executar comando como o usuário do projeto no diretório do projeto
    const { stdout, stderr } = await execAsync(
      `sudo -u ${projectAlias} bash -c 'cd "${projectPath}" && ${command}'`,
      {
        timeout: 300000, // 5 minutos timeout
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      }
    );

    // Combinar stdout e stderr
    let output = '';
    if (stdout) {
      output += stdout;
    }
    if (stderr) {
      output += stderr;
    }

    if (!output.trim()) {
      output = '[Comando executado com sucesso - sem saída]';
    }

    console.log(`✅ Comando executado com sucesso`);
    return output;

  } catch (error) {
    console.error(`❌ Erro ao executar comando: ${error.message}`);

    // Se o erro tiver stdout/stderr, incluir na mensagem
    let errorMessage = `Erro: ${error.message}`;

    if (error.stdout) {
      errorMessage += `\n\nSaída padrão:\n${error.stdout}`;
    }

    if (error.stderr) {
      errorMessage += `\n\nSaída de erro:\n${error.stderr}`;
    }

    throw new Error(errorMessage);
  }
}
