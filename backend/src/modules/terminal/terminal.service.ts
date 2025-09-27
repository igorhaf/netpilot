import { Injectable } from '@nestjs/common';
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

@Injectable()
export class TerminalService extends EventEmitter {
  private activeCommands = new Map<string, any>();

  executeCommand(commandId: string, command: string): void {
    try {
      // Parse do comando (split por espaços, considerando aspas)
      const args = this.parseCommand(command);
      const cmd = args.shift();

      if (!cmd) {
        this.emit('output', {
          id: commandId,
          type: 'error',
          data: 'Comando inválido',
          timestamp: new Date(),
          command,
        } as CommandOutput);
        return;
      }

      // Spawn do processo
      const childProcess = spawn(cmd, args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true,
        env: { ...process.env, FORCE_COLOR: '1' }, // Preservar cores ANSI
      });

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
        const output: CommandOutput = {
          id: commandId,
          type: 'stdout',
          data: data.toString(),
          timestamp: new Date(),
        };
        this.emit('output', output);
      });

      // Stderr handler
      childProcess.stderr?.on('data', (data: Buffer) => {
        const output: CommandOutput = {
          id: commandId,
          type: 'stderr',
          data: data.toString(),
          timestamp: new Date(),
        };
        this.emit('output', output);
      });

      // Exit handler
      childProcess.on('exit', (code, signal) => {
        this.activeCommands.delete(commandId);

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