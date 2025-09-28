"""
NetPilot System Operations - System Utilities
Utilitários para operações de sistema
"""

import os
import subprocess
import asyncio
import logging
from typing import List, Dict, Any, Optional, NamedTuple
from pathlib import Path

logger = logging.getLogger(__name__)


class CommandResult(NamedTuple):
    """Resultado de execução de comando"""
    returncode: int
    stdout: str
    stderr: str
    execution_time: float


class SystemUtils:
    """Utilitários para operações de sistema"""

    def __init__(self):
        self.max_timeout = int(os.getenv("MAX_COMMAND_TIMEOUT", 300))

    async def run_command(self, command: List[str], timeout: Optional[int] = None,
                         cwd: Optional[str] = None, env: Optional[Dict[str, str]] = None) -> CommandResult:
        """Executar comando do sistema de forma assíncrona"""
        if timeout is None:
            timeout = self.max_timeout

        if timeout > self.max_timeout:
            timeout = self.max_timeout

        logger.debug(f"Executando comando: {' '.join(command)}")

        start_time = asyncio.get_event_loop().time()

        try:
            # Preparar ambiente
            process_env = os.environ.copy()
            if env:
                process_env.update(env)

            # Criar processo
            process = await asyncio.create_subprocess_exec(
                *command,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                cwd=cwd,
                env=process_env
            )

            # Executar com timeout
            try:
                stdout, stderr = await asyncio.wait_for(
                    process.communicate(),
                    timeout=timeout
                )

                execution_time = asyncio.get_event_loop().time() - start_time

                return CommandResult(
                    returncode=process.returncode,
                    stdout=stdout.decode('utf-8', errors='replace'),
                    stderr=stderr.decode('utf-8', errors='replace'),
                    execution_time=execution_time
                )

            except asyncio.TimeoutError:
                # Matar processo em caso de timeout
                process.terminate()
                try:
                    await asyncio.wait_for(process.wait(), timeout=5)
                except asyncio.TimeoutError:
                    process.kill()
                    await process.wait()

                execution_time = asyncio.get_event_loop().time() - start_time

                return CommandResult(
                    returncode=-1,
                    stdout="",
                    stderr=f"Command timed out after {timeout} seconds",
                    execution_time=execution_time
                )

        except Exception as e:
            execution_time = asyncio.get_event_loop().time() - start_time
            logger.error(f"Erro ao executar comando: {e}")

            return CommandResult(
                returncode=-1,
                stdout="",
                stderr=str(e),
                execution_time=execution_time
            )

    async def run_command_with_input(self, command: List[str], input_data: str,
                                   timeout: Optional[int] = None,
                                   cwd: Optional[str] = None) -> CommandResult:
        """Executar comando com entrada de dados"""
        if timeout is None:
            timeout = self.max_timeout

        logger.debug(f"Executando comando com input: {' '.join(command)}")

        start_time = asyncio.get_event_loop().time()

        try:
            process = await asyncio.create_subprocess_exec(
                *command,
                stdin=asyncio.subprocess.PIPE,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                cwd=cwd
            )

            # Enviar dados de entrada
            try:
                stdout, stderr = await asyncio.wait_for(
                    process.communicate(input=input_data.encode()),
                    timeout=timeout
                )

                execution_time = asyncio.get_event_loop().time() - start_time

                return CommandResult(
                    returncode=process.returncode,
                    stdout=stdout.decode('utf-8', errors='replace'),
                    stderr=stderr.decode('utf-8', errors='replace'),
                    execution_time=execution_time
                )

            except asyncio.TimeoutError:
                process.terminate()
                try:
                    await asyncio.wait_for(process.wait(), timeout=5)
                except asyncio.TimeoutError:
                    process.kill()
                    await process.wait()

                execution_time = asyncio.get_event_loop().time() - start_time

                return CommandResult(
                    returncode=-1,
                    stdout="",
                    stderr=f"Command timed out after {timeout} seconds",
                    execution_time=execution_time
                )

        except Exception as e:
            execution_time = asyncio.get_event_loop().time() - start_time
            logger.error(f"Erro ao executar comando com input: {e}")

            return CommandResult(
                returncode=-1,
                stdout="",
                stderr=str(e),
                execution_time=execution_time
            )

    def file_exists(self, file_path: str) -> bool:
        """Verificar se arquivo existe"""
        return os.path.exists(file_path)

    def directory_exists(self, dir_path: str) -> bool:
        """Verificar se diretório existe"""
        return os.path.isdir(dir_path)

    def create_directory(self, dir_path: str, mode: int = 0o755, parents: bool = True) -> bool:
        """Criar diretório"""
        try:
            Path(dir_path).mkdir(mode=mode, parents=parents, exist_ok=True)
            return True
        except Exception as e:
            logger.error(f"Erro ao criar diretório {dir_path}: {e}")
            return False

    def read_file(self, file_path: str, encoding: str = 'utf-8') -> Optional[str]:
        """Ler arquivo"""
        try:
            with open(file_path, 'r', encoding=encoding) as f:
                return f.read()
        except Exception as e:
            logger.error(f"Erro ao ler arquivo {file_path}: {e}")
            return None

    def write_file(self, file_path: str, content: str, encoding: str = 'utf-8',
                   mode: int = 0o644) -> bool:
        """Escrever arquivo"""
        try:
            # Criar diretório pai se não existir
            parent_dir = os.path.dirname(file_path)
            if parent_dir:
                self.create_directory(parent_dir)

            with open(file_path, 'w', encoding=encoding) as f:
                f.write(content)

            # Definir permissões
            os.chmod(file_path, mode)
            return True

        except Exception as e:
            logger.error(f"Erro ao escrever arquivo {file_path}: {e}")
            return False

    def append_file(self, file_path: str, content: str, encoding: str = 'utf-8') -> bool:
        """Anexar conteúdo ao arquivo"""
        try:
            with open(file_path, 'a', encoding=encoding) as f:
                f.write(content)
            return True
        except Exception as e:
            logger.error(f"Erro ao anexar conteúdo ao arquivo {file_path}: {e}")
            return False

    def copy_file(self, source: str, destination: str, preserve_permissions: bool = True) -> bool:
        """Copiar arquivo"""
        try:
            import shutil
            if preserve_permissions:
                shutil.copy2(source, destination)
            else:
                shutil.copy(source, destination)
            return True
        except Exception as e:
            logger.error(f"Erro ao copiar arquivo {source} para {destination}: {e}")
            return False

    def move_file(self, source: str, destination: str) -> bool:
        """Mover arquivo"""
        try:
            import shutil
            shutil.move(source, destination)
            return True
        except Exception as e:
            logger.error(f"Erro ao mover arquivo {source} para {destination}: {e}")
            return False

    def delete_file(self, file_path: str) -> bool:
        """Deletar arquivo"""
        try:
            os.remove(file_path)
            return True
        except Exception as e:
            logger.error(f"Erro ao deletar arquivo {file_path}: {e}")
            return False

    def get_file_size(self, file_path: str) -> Optional[int]:
        """Obter tamanho do arquivo em bytes"""
        try:
            return os.path.getsize(file_path)
        except Exception as e:
            logger.error(f"Erro ao obter tamanho do arquivo {file_path}: {e}")
            return None

    def get_file_permissions(self, file_path: str) -> Optional[str]:
        """Obter permissões do arquivo em formato octal"""
        try:
            import stat
            mode = os.stat(file_path).st_mode
            return oct(stat.S_IMODE(mode))
        except Exception as e:
            logger.error(f"Erro ao obter permissões do arquivo {file_path}: {e}")
            return None

    def set_file_permissions(self, file_path: str, mode: int) -> bool:
        """Definir permissões do arquivo"""
        try:
            os.chmod(file_path, mode)
            return True
        except Exception as e:
            logger.error(f"Erro ao definir permissões do arquivo {file_path}: {e}")
            return False

    def get_disk_usage(self, path: str) -> Optional[Dict[str, int]]:
        """Obter uso de disco para um caminho"""
        try:
            import shutil
            total, used, free = shutil.disk_usage(path)
            return {
                "total": total,
                "used": used,
                "free": free,
                "percent": (used / total) * 100 if total > 0 else 0
            }
        except Exception as e:
            logger.error(f"Erro ao obter uso de disco para {path}: {e}")
            return None

    def is_process_running(self, pid: int) -> bool:
        """Verificar se processo está rodando"""
        try:
            os.kill(pid, 0)
            return True
        except (OSError, ProcessLookupError):
            return False

    def kill_process(self, pid: int, signal: int = 15) -> bool:
        """Matar processo por PID"""
        try:
            os.kill(pid, signal)
            return True
        except Exception as e:
            logger.error(f"Erro ao matar processo {pid}: {e}")
            return False

    async def find_process_by_name(self, process_name: str) -> List[Dict[str, Any]]:
        """Encontrar processos por nome"""
        try:
            result = await self.run_command(["pgrep", "-f", process_name])

            if result.returncode != 0:
                return []

            pids = [int(pid.strip()) for pid in result.stdout.split('\n') if pid.strip()]

            processes = []
            for pid in pids:
                try:
                    # Obter informações do processo
                    cmd_result = await self.run_command(["ps", "-p", str(pid), "-o", "pid,ppid,cmd", "--no-headers"])
                    if cmd_result.returncode == 0 and cmd_result.stdout.strip():
                        parts = cmd_result.stdout.strip().split(None, 2)
                        if len(parts) >= 3:
                            processes.append({
                                "pid": int(parts[0]),
                                "ppid": int(parts[1]),
                                "command": parts[2]
                            })
                except:
                    continue

            return processes

        except Exception as e:
            logger.error(f"Erro ao encontrar processo {process_name}: {e}")
            return []

    def get_system_info(self) -> Dict[str, Any]:
        """Obter informações básicas do sistema"""
        try:
            import platform
            import psutil

            return {
                "hostname": platform.node(),
                "system": platform.system(),
                "release": platform.release(),
                "version": platform.version(),
                "machine": platform.machine(),
                "processor": platform.processor(),
                "cpu_count": psutil.cpu_count(),
                "memory_total": psutil.virtual_memory().total,
                "boot_time": psutil.boot_time(),
                "python_version": platform.python_version()
            }

        except Exception as e:
            logger.error(f"Erro ao obter informações do sistema: {e}")
            return {}

    def validate_path(self, file_path: str, allowed_paths: List[str] = None) -> bool:
        """Validar se caminho é seguro"""
        try:
            # Resolver caminho absoluto
            abs_path = os.path.abspath(file_path)

            # Verificar se não contém traversal
            if '..' in abs_path or abs_path != os.path.normpath(abs_path):
                return False

            # Verificar contra lista de caminhos permitidos
            if allowed_paths:
                return any(abs_path.startswith(allowed) for allowed in allowed_paths)

            # Verificar contra caminhos perigosos
            dangerous_paths = ['/etc/passwd', '/etc/shadow', '/etc/sudoers', '/root']
            if any(abs_path.startswith(dangerous) for dangerous in dangerous_paths):
                return False

            return True

        except Exception:
            return False

    async def get_service_status(self, service_name: str) -> Dict[str, Any]:
        """Obter status de um serviço systemd"""
        try:
            result = await self.run_command(["systemctl", "status", service_name])

            is_active = await self.run_command(["systemctl", "is-active", service_name])
            is_enabled = await self.run_command(["systemctl", "is-enabled", service_name])

            return {
                "service": service_name,
                "active": is_active.returncode == 0,
                "enabled": is_enabled.returncode == 0,
                "status_output": result.stdout,
                "status_code": result.returncode
            }

        except Exception as e:
            logger.error(f"Erro ao obter status do serviço {service_name}: {e}")
            return {
                "service": service_name,
                "active": False,
                "enabled": False,
                "error": str(e)
            }

    def backup_file(self, file_path: str, backup_suffix: str = None) -> Optional[str]:
        """Criar backup de um arquivo"""
        try:
            if not os.path.exists(file_path):
                return None

            if backup_suffix is None:
                from datetime import datetime
                backup_suffix = datetime.now().strftime("%Y%m%d_%H%M%S")

            backup_path = f"{file_path}.backup_{backup_suffix}"

            if self.copy_file(file_path, backup_path):
                return backup_path

            return None

        except Exception as e:
            logger.error(f"Erro ao criar backup de {file_path}: {e}")
            return None