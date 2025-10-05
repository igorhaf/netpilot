"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeTerminalCommand = executeTerminalCommand;
const child_process_1 = require("child_process");
const util_1 = require("util");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
async function executeTerminalCommand(metadata) {
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
        const { stdout, stderr } = await execAsync(`sudo -u ${projectAlias} bash -c 'cd "${projectPath}" && ${command}'`, {
            timeout: 300000,
            maxBuffer: 10 * 1024 * 1024,
        });
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
    }
    catch (error) {
        console.error(`❌ Erro ao executar comando: ${error.message}`);
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
//# sourceMappingURL=terminal-command.script.js.map