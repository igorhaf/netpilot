import { Injectable, Logger } from '@nestjs/common';
import { spawn } from 'child_process';
import { EventEmitter } from 'events';

export interface CommandOutput {
  id: string;
  type: 'stdout' | 'stderr' | 'exit' | 'error';
  data: string;
  timestamp: Date;
  command?: string;
  exitCode?: number;
}

export interface ExecuteCommandOptions {
  workingDir?: string;
  user?: string;
}

@Injectable()
export class TerminalService extends EventEmitter {
  private readonly logger = new Logger(TerminalService.name);
  private activeCommands = new Map<string, any>();

  executeCommand(commandId: string, command: string, options?: ExecuteCommandOptions): void {
    try {
      let fullCommand = command;
      // Detectar se estamos em container Docker verificando se /host/home existe
      const fs = require('fs');
      const isDocker = fs.existsSync('/host/home');

      this.logger.log(`[TerminalService] isDocker: ${isDocker}, user: ${options?.user}, command: ${command}`);

      // Se um usuário foi especificado, executar comando como esse usuário
      if (options?.user) {
        let workDir = options.workingDir || `/home/${options.user}`;
        const escapedCommand = command.replace(/"/g, '\\"').replace(/'/g, "\\'");

        if (isDocker) {
          // Em ambiente Docker, o /home do host está montado em /host/home
          workDir = workDir.replace('/home', '/host/home');
          // Executar comando diretamente no workdir montado
          fullCommand = `cd ${workDir} && ${command}`;
          this.logger.log(`[TerminalService] Docker mode - executing: ${fullCommand}`);
        } else {
          // Fora do Docker, usar sudo normalmente
          fullCommand = `sudo -u ${options.user} bash -c "cd ${workDir} && ${escapedCommand}"`;
          this.logger.log(`[TerminalService] Host mode - executing with sudo`);
        }
      } else {
        this.logger.log(`[TerminalService] No user specified, executing directly: ${command}`);
      }

      // Spawn do processo
      const spawnOptions: any = {
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true,
        env: { ...process.env, FORCE_COLOR: '1' }, // Preservar cores ANSI
      };

      // Se workingDir foi especificado e não estamos usando sudo, aplicar cwd
      if (options?.workingDir && !options?.user) {
        spawnOptions.cwd = options.workingDir;
      }

      const childProcess = spawn(fullCommand, [], spawnOptions);

      this.activeCommands.set(commandId, childProcess);

      // Emitir início do comando
      this.emit('output', {
        id: commandId,
        type: 'stdout',
        data: `$ ${command}`,
        timestamp: new Date(),
        command,
      } as CommandOutput);

      // Stdout handler
      childProcess.stdout?.on('data', (data: Buffer) => {
        const dataStr = data.toString();
        this.logger.log(`[TerminalService] STDOUT (${commandId}): ${dataStr}`);
        const output: CommandOutput = {
          id: commandId,
          type: 'stdout',
          data: dataStr,
          timestamp: new Date(),
        };
        this.emit('output', output);
      });

      // Stderr handler
      childProcess.stderr?.on('data', (data: Buffer) => {
        const dataStr = data.toString();
        this.logger.log(`[TerminalService] STDERR (${commandId}): ${dataStr}`);
        const output: CommandOutput = {
          id: commandId,
          type: 'stderr',
          data: dataStr,
          timestamp: new Date(),
        };
        this.emit('output', output);
      });

      // Exit handler
      childProcess.on('exit', (code, signal) => {
        this.activeCommands.delete(commandId);
        this.logger.log(`[TerminalService] EXIT (${commandId}): code=${code}, signal=${signal}`);

        const output: CommandOutput = {
          id: commandId,
          type: 'exit',
          data: signal
            ? `Process terminated by signal: ${signal}`
            : `Process exited with code: ${code}`,
          timestamp: new Date(),
          exitCode: code,
        };
        this.emit('output', output);
      });

      // Error handler
      childProcess.on('error', (error) => {
        this.activeCommands.delete(commandId);

        const output: CommandOutput = {
          id: commandId,
          type: 'error',
          data: `Error: ${error.message}`,
          timestamp: new Date(),
        };
        this.emit('output', output);
      });

    } catch (error) {
      const output: CommandOutput = {
        id: commandId,
        type: 'error',
        data: `Failed to execute command: ${error.message}`,
        timestamp: new Date(),
        command,
      };
      this.emit('output', output);
    }
  }

  killCommand(commandId: string): boolean {
    const childProcess = this.activeCommands.get(commandId);
    if (childProcess) {
      childProcess.kill('SIGTERM');
      this.activeCommands.delete(commandId);
      return true;
    }
    return false;
  }

  private parseCommand(command: string): string[] {
    const args: string[] = [];
    let current = '';
    let inQuotes = false;
    let quoteChar = '';

    for (let i = 0; i < command.length; i++) {
      const char = command[i];

      if ((char === '"' || char === "'") && !inQuotes) {
        inQuotes = true;
        quoteChar = char;
      } else if (char === quoteChar && inQuotes) {
        inQuotes = false;
        quoteChar = '';
      } else if (char === ' ' && !inQuotes) {
        if (current.trim()) {
          args.push(current.trim());
          current = '';
        }
      } else {
        current += char;
      }
    }

    if (current.trim()) {
      args.push(current.trim());
    }

    return args;
  }

  getActiveCommands(): string[] {
    return Array.from(this.activeCommands.keys());
  }
}