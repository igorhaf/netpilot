"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var TerminalService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TerminalService = void 0;
const common_1 = require("@nestjs/common");
const child_process_1 = require("child_process");
const events_1 = require("events");
let TerminalService = TerminalService_1 = class TerminalService extends events_1.EventEmitter {
    constructor() {
        super(...arguments);
        this.logger = new common_1.Logger(TerminalService_1.name);
        this.activeCommands = new Map();
    }
    executeCommand(commandId, command, options) {
        try {
            let fullCommand = command;
            const fs = require('fs');
            const isDocker = fs.existsSync('/host/home');
            this.logger.log(`[TerminalService] isDocker: ${isDocker}, user: ${options?.user}, command: ${command}`);
            if (command.match(/^\s*ls\s/)) {
                if (!command.includes('--color')) {
                    fullCommand = command.replace(/^(\s*ls\s)/, '$1--color=always ');
                }
            }
            if (options?.user) {
                let workDir = options.workingDir || `/home/${options.user}`;
                const escapedCommand = fullCommand.replace(/"/g, '\\"').replace(/'/g, "\\'");
                if (isDocker) {
                    workDir = workDir.replace('/home', '/host/home');
                    fullCommand = `cd ${workDir} && ${fullCommand}`;
                    this.logger.log(`[TerminalService] Docker mode - executing: ${fullCommand}`);
                }
                else {
                    fullCommand = `sudo -u ${options.user} bash -c "cd ${workDir} && ${escapedCommand}"`;
                    this.logger.log(`[TerminalService] Host mode - executing with sudo`);
                }
            }
            else {
                this.logger.log(`[TerminalService] No user specified, executing directly: ${fullCommand}`);
            }
            const spawnOptions = {
                stdio: ['pipe', 'pipe', 'pipe'],
                shell: true,
                env: {
                    ...process.env,
                    FORCE_COLOR: '1',
                    COLORTERM: 'truecolor',
                    TERM: 'xterm-256color',
                    CLICOLOR: '1',
                    CLICOLOR_FORCE: '1'
                },
            };
            if (options?.workingDir && !options?.user) {
                spawnOptions.cwd = options.workingDir;
            }
            const childProcess = (0, child_process_1.spawn)(fullCommand, [], spawnOptions);
            this.activeCommands.set(commandId, childProcess);
            this.emit('output', {
                id: commandId,
                type: 'stdout',
                data: `$ ${command}`,
                timestamp: new Date(),
                command,
            });
            childProcess.stdout?.on('data', (data) => {
                const dataStr = data.toString();
                this.logger.log(`[TerminalService] STDOUT (${commandId}): ${dataStr}`);
                const output = {
                    id: commandId,
                    type: 'stdout',
                    data: dataStr,
                    timestamp: new Date(),
                };
                this.emit('output', output);
            });
            childProcess.stderr?.on('data', (data) => {
                const dataStr = data.toString();
                this.logger.log(`[TerminalService] STDERR (${commandId}): ${dataStr}`);
                const output = {
                    id: commandId,
                    type: 'stderr',
                    data: dataStr,
                    timestamp: new Date(),
                };
                this.emit('output', output);
            });
            childProcess.on('exit', (code, signal) => {
                this.activeCommands.delete(commandId);
                this.logger.log(`[TerminalService] EXIT (${commandId}): code=${code}, signal=${signal}`);
                const output = {
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
            childProcess.on('error', (error) => {
                this.activeCommands.delete(commandId);
                const output = {
                    id: commandId,
                    type: 'error',
                    data: `Error: ${error.message}`,
                    timestamp: new Date(),
                };
                this.emit('output', output);
            });
        }
        catch (error) {
            const output = {
                id: commandId,
                type: 'error',
                data: `Failed to execute command: ${error.message}`,
                timestamp: new Date(),
                command,
            };
            this.emit('output', output);
        }
    }
    killCommand(commandId) {
        const childProcess = this.activeCommands.get(commandId);
        if (childProcess) {
            childProcess.kill('SIGTERM');
            this.activeCommands.delete(commandId);
            return true;
        }
        return false;
    }
    parseCommand(command) {
        const args = [];
        let current = '';
        let inQuotes = false;
        let quoteChar = '';
        for (let i = 0; i < command.length; i++) {
            const char = command[i];
            if ((char === '"' || char === "'") && !inQuotes) {
                inQuotes = true;
                quoteChar = char;
            }
            else if (char === quoteChar && inQuotes) {
                inQuotes = false;
                quoteChar = '';
            }
            else if (char === ' ' && !inQuotes) {
                if (current.trim()) {
                    args.push(current.trim());
                    current = '';
                }
            }
            else {
                current += char;
            }
        }
        if (current.trim()) {
            args.push(current.trim());
        }
        return args;
    }
    getActiveCommands() {
        return Array.from(this.activeCommands.keys());
    }
};
exports.TerminalService = TerminalService;
exports.TerminalService = TerminalService = TerminalService_1 = __decorate([
    (0, common_1.Injectable)()
], TerminalService);
//# sourceMappingURL=terminal.service.js.map