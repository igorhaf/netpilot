"""
NetPilot System Operations - User Service
Serviço para gerenciamento de usuários e sessões
"""

import os
import uuid
import logging
import subprocess
import tempfile
import asyncio
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from pathlib import Path

from models.users import (
    SystemUser, TerminalSession, CommandExecution, SessionInfo,
    SessionList, CommandResult, UserActivity, UserSession,
    UserType, SessionStatus, CommandStatus
)
from utils.system import SystemUtils
from utils.security import SecurityValidator
from utils.callbacks import CallbackManager

logger = logging.getLogger(__name__)


class UserService:
    """Serviço para gerenciamento de usuários e sessões"""

    def __init__(self):
        self.system_utils = SystemUtils()
        self.security = SecurityValidator()
        self.callback_manager = CallbackManager()

        # Armazenamento de sessões ativas (em produção, usar Redis)
        self.active_sessions: Dict[str, Dict[str, Any]] = {}
        self.command_history: Dict[str, List[CommandResult]] = {}

    async def create_system_user(self, user_config: SystemUser) -> Dict[str, Any]:
        """Criar usuário do sistema"""
        try:
            logger.info(f"Criando usuário do sistema: {user_config.username}")

            # Validar se usuário já existe
            if await self._user_exists(user_config.username):
                raise Exception(f"Usuário já existe: {user_config.username}")

            # Comando base para criar usuário
            cmd = ["useradd"]

            # Configurar home directory
            if user_config.home_directory:
                cmd.extend(["-d", user_config.home_directory])
            else:
                cmd.extend(["-m"])  # Criar home directory padrão

            # Shell
            cmd.extend(["-s", user_config.shell])

            # Grupos
            if user_config.groups:
                cmd.extend(["-G", ",".join(user_config.groups)])

            # Data de expiração
            if user_config.expires_at:
                expire_date = user_config.expires_at.strftime("%Y-%m-%d")
                cmd.extend(["-e", expire_date])

            # Nome do usuário
            cmd.append(user_config.username)

            # Executar comando
            result = await self.system_utils.run_command(cmd)

            if result.returncode != 0:
                raise Exception(f"Falha ao criar usuário: {result.stderr}")

            # Configurar SSH se fornecido
            if user_config.ssh_key:
                await self._setup_ssh_key(user_config.username, user_config.ssh_key)

            # Configurar SFTP se necessário
            if user_config.user_type == UserType.SFTP:
                await self._setup_sftp_user(user_config)

            # Configurar sudo se necessário
            if user_config.sudo_access:
                await self._grant_sudo_access(user_config.username)

            # Callback
            if user_config.callback_url:
                await self.callback_manager.send_callback(
                    user_config.callback_url,
                    {
                        "operation": "system_user_created",
                        "status": "success",
                        "username": user_config.username,
                        "user_type": user_config.user_type
                    }
                )

            return {
                "success": True,
                "message": f"Usuário {user_config.username} criado com sucesso",
                "username": user_config.username,
                "user_type": user_config.user_type,
                "home_directory": user_config.home_directory or f"/home/{user_config.username}"
            }

        except Exception as e:
            logger.error(f"Erro ao criar usuário: {e}")

            if user_config.callback_url:
                await self.callback_manager.send_callback(
                    user_config.callback_url,
                    {
                        "operation": "system_user_created",
                        "status": "error",
                        "error": str(e)
                    }
                )

            raise

    async def create_terminal_session(self, session_config: TerminalSession) -> Dict[str, Any]:
        """Criar sessão terminal"""
        try:
            logger.info(f"Criando sessão terminal para usuário: {session_config.username}")

            # Validar usuário
            if not await self._user_exists(session_config.username):
                raise Exception(f"Usuário não encontrado: {session_config.username}")

            # Verificar máximo de sessões
            user_sessions = await self._get_user_sessions(session_config.username)
            if len(user_sessions) >= 5:  # Máximo padrão
                raise Exception("Máximo de sessões atingido para o usuário")

            # Gerar ID da sessão
            session_id = str(uuid.uuid4())

            # Configurar ambiente
            env = {
                "HOME": f"/home/{session_config.username}",
                "USER": session_config.username,
                "SHELL": session_config.session_type,
                "TERM": "xterm-256color",
                **session_config.environment_vars
            }

            # Diretório de trabalho
            working_dir = session_config.working_directory or f"/home/{session_config.username}"

            # Criar processo da sessão
            if session_config.ssh_host:
                # Sessão SSH remota
                cmd = self._build_ssh_command(session_config)
            else:
                # Sessão local
                cmd = [session_config.session_type]

            # Iniciar processo
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdin=asyncio.subprocess.PIPE,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                env=env,
                cwd=working_dir
            )

            # Armazenar informações da sessão
            session_info = {
                "session_id": session_id,
                "username": session_config.username,
                "session_type": session_config.session_type,
                "status": SessionStatus.ACTIVE,
                "created_at": datetime.now(),
                "last_activity": datetime.now(),
                "working_directory": working_dir,
                "pid": process.pid,
                "process": process,
                "restricted_mode": session_config.restricted_mode,
                "allowed_commands": session_config.allowed_commands,
                "log_commands": session_config.log_commands,
                "timeout": session_config.timeout,
                "commands_executed": 0,
                "violations": 0
            }

            self.active_sessions[session_id] = session_info
            self.command_history[session_id] = []

            # Configurar timeout da sessão
            if session_config.timeout > 0:
                asyncio.create_task(self._session_timeout_handler(session_id, session_config.timeout))

            # Callback
            if session_config.callback_url:
                await self.callback_manager.send_callback(
                    session_config.callback_url,
                    {
                        "operation": "terminal_session_created",
                        "status": "success",
                        "session_id": session_id,
                        "username": session_config.username
                    }
                )

            return {
                "success": True,
                "message": "Sessão terminal criada com sucesso",
                "session_id": session_id,
                "username": session_config.username,
                "pid": process.pid,
                "timeout": session_config.timeout
            }

        except Exception as e:
            logger.error(f"Erro ao criar sessão terminal: {e}")

            if session_config.callback_url:
                await self.callback_manager.send_callback(
                    session_config.callback_url,
                    {
                        "operation": "terminal_session_created",
                        "status": "error",
                        "error": str(e)
                    }
                )

            raise

    async def execute_command(self, command_config: CommandExecution) -> CommandResult:
        """Executar comando em uma sessão"""
        try:
            session_id = command_config.session_id

            if session_id not in self.active_sessions:
                raise Exception(f"Sessão não encontrada: {session_id}")

            session = self.active_sessions[session_id]

            if session["status"] != SessionStatus.ACTIVE:
                raise Exception(f"Sessão não está ativa: {session_id}")

            # Validar comando se habilitado
            if command_config.validate_command:
                violations = self.security.validate_command(
                    command_config.command,
                    session.get("allowed_commands", []),
                    session.get("restricted_mode", True)
                )
                if violations:
                    session["violations"] += len(violations)
                    raise Exception(f"Comando rejeitado: {', '.join(violations)}")

            # Gerar ID do comando
            command_id = str(uuid.uuid4())

            # Executar comando
            if command_config.async_execution:
                # Execução assíncrona
                result = await self._execute_command_async(session, command_config, command_id)
            else:
                # Execução síncrona
                result = await self._execute_command_sync(session, command_config, command_id)

            # Atualizar estatísticas da sessão
            session["commands_executed"] += 1
            session["last_activity"] = datetime.now()

            # Adicionar ao histórico
            self.command_history[session_id].append(result)

            # Callback
            if command_config.callback_url:
                await self.callback_manager.send_callback(
                    command_config.callback_url,
                    {
                        "operation": "command_executed",
                        "status": "success" if result.status == CommandStatus.COMPLETED else "error",
                        "command_id": command_id,
                        "session_id": session_id,
                        "exit_code": result.exit_code
                    }
                )

            return result

        except Exception as e:
            logger.error(f"Erro ao executar comando: {e}")

            # Criar resultado de erro
            error_result = CommandResult(
                command_id=str(uuid.uuid4()),
                session_id=command_config.session_id,
                command=command_config.command,
                status=CommandStatus.FAILED,
                started_at=datetime.now(),
                completed_at=datetime.now(),
                execution_time=0,
                stderr=str(e),
                validated=command_config.validate_command,
                violations=[str(e)]
            )

            if command_config.callback_url:
                await self.callback_manager.send_callback(
                    command_config.callback_url,
                    {
                        "operation": "command_executed",
                        "status": "error",
                        "error": str(e)
                    }
                )

            return error_result

    async def list_sessions(self) -> SessionList:
        """Listar sessões ativas"""
        try:
            sessions = []
            total_sessions = len(self.active_sessions)
            active_sessions = 0
            users = set()

            for session_id, session_data in self.active_sessions.items():
                session_info = SessionInfo(
                    session_id=session_id,
                    username=session_data["username"],
                    session_type=session_data["session_type"],
                    status=session_data["status"],
                    created_at=session_data["created_at"],
                    last_activity=session_data["last_activity"],
                    working_directory=session_data["working_directory"],
                    pid=session_data.get("pid"),
                    commands_executed=session_data["commands_executed"],
                    total_runtime=int((datetime.now() - session_data["created_at"]).total_seconds()),
                    restricted_mode=session_data["restricted_mode"],
                    violations=session_data["violations"]
                )

                sessions.append(session_info)

                if session_data["status"] == SessionStatus.ACTIVE:
                    active_sessions += 1

                users.add(session_data["username"])

            return SessionList(
                sessions=sessions,
                total_sessions=total_sessions,
                active_sessions=active_sessions,
                users_connected=len(users)
            )

        except Exception as e:
            logger.error(f"Erro ao listar sessões: {e}")
            raise

    async def close_session(self, session_id: str) -> Dict[str, Any]:
        """Fechar sessão terminal"""
        try:
            if session_id not in self.active_sessions:
                raise Exception(f"Sessão não encontrada: {session_id}")

            session = self.active_sessions[session_id]

            # Terminar processo se ainda estiver rodando
            if "process" in session and session["process"]:
                try:
                    session["process"].terminate()
                    await asyncio.sleep(2)  # Aguardar terminação graceful

                    if session["process"].returncode is None:
                        session["process"].kill()  # Force kill se necessário

                except:
                    pass

            # Atualizar status
            session["status"] = SessionStatus.TERMINATED

            # Remover da lista de sessões ativas
            del self.active_sessions[session_id]

            # Limpar histórico de comandos (opcional)
            if session_id in self.command_history:
                del self.command_history[session_id]

            return {
                "success": True,
                "message": f"Sessão {session_id} fechada com sucesso",
                "session_id": session_id
            }

        except Exception as e:
            logger.error(f"Erro ao fechar sessão: {e}")
            raise

    async def _user_exists(self, username: str) -> bool:
        """Verificar se usuário existe"""
        try:
            result = await self.system_utils.run_command(["id", username])
            return result.returncode == 0
        except:
            return False

    async def _setup_ssh_key(self, username: str, ssh_key: str):
        """Configurar chave SSH para usuário"""
        user_home = f"/home/{username}"
        ssh_dir = f"{user_home}/.ssh"
        authorized_keys = f"{ssh_dir}/authorized_keys"

        # Criar diretório .ssh
        Path(ssh_dir).mkdir(mode=0o700, exist_ok=True)

        # Escrever chave autorizada
        with open(authorized_keys, 'w') as f:
            f.write(ssh_key)

        # Definir permissões corretas
        os.chmod(authorized_keys, 0o600)

        # Alterar proprietário
        await self.system_utils.run_command(["chown", "-R", f"{username}:{username}", ssh_dir])

    async def _setup_sftp_user(self, user_config: SystemUser):
        """Configurar usuário SFTP com chroot"""
        # TODO: Implementar configuração SFTP com chroot
        pass

    async def _grant_sudo_access(self, username: str):
        """Conceder acesso sudo ao usuário"""
        sudoers_file = f"/etc/sudoers.d/{username}"

        with open(sudoers_file, 'w') as f:
            f.write(f"{username} ALL=(ALL) NOPASSWD:ALL\n")

        os.chmod(sudoers_file, 0o440)

    def _build_ssh_command(self, session_config: TerminalSession) -> List[str]:
        """Construir comando SSH"""
        cmd = ["ssh"]

        if session_config.ssh_port != 22:
            cmd.extend(["-p", str(session_config.ssh_port)])

        if session_config.ssh_key_path:
            cmd.extend(["-i", session_config.ssh_key_path])

        cmd.append(f"{session_config.username}@{session_config.ssh_host}")

        return cmd

    async def _execute_command_sync(self, session: Dict, command_config: CommandExecution, command_id: str) -> CommandResult:
        """Executar comando de forma síncrona"""
        started_at = datetime.now()

        try:
            # Executar comando via subprocess
            env = {**os.environ, **command_config.environment_vars}

            process = await asyncio.create_subprocess_shell(
                command_config.command,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                env=env,
                cwd=command_config.working_directory or session["working_directory"]
            )

            try:
                stdout, stderr = await asyncio.wait_for(
                    process.communicate(),
                    timeout=command_config.timeout
                )

                completed_at = datetime.now()
                execution_time = (completed_at - started_at).total_seconds()

                return CommandResult(
                    command_id=command_id,
                    session_id=session["session_id"],
                    command=command_config.command,
                    status=CommandStatus.COMPLETED if process.returncode == 0 else CommandStatus.FAILED,
                    started_at=started_at,
                    completed_at=completed_at,
                    execution_time=execution_time,
                    stdout=stdout.decode() if stdout else "",
                    stderr=stderr.decode() if stderr else "",
                    exit_code=process.returncode,
                    validated=command_config.validate_command
                )

            except asyncio.TimeoutError:
                process.kill()
                return CommandResult(
                    command_id=command_id,
                    session_id=session["session_id"],
                    command=command_config.command,
                    status=CommandStatus.TIMEOUT,
                    started_at=started_at,
                    completed_at=datetime.now(),
                    execution_time=command_config.timeout,
                    stderr="Command timed out",
                    validated=command_config.validate_command
                )

        except Exception as e:
            return CommandResult(
                command_id=command_id,
                session_id=session["session_id"],
                command=command_config.command,
                status=CommandStatus.FAILED,
                started_at=started_at,
                completed_at=datetime.now(),
                execution_time=0,
                stderr=str(e),
                validated=command_config.validate_command,
                violations=[str(e)]
            )

    async def _execute_command_async(self, session: Dict, command_config: CommandExecution, command_id: str) -> CommandResult:
        """Executar comando de forma assíncrona"""
        # Para execução assíncrona, retornar imediatamente com status RUNNING
        # O resultado real seria obtido via callback ou polling

        started_at = datetime.now()

        # Iniciar comando em background
        asyncio.create_task(self._background_command_execution(session, command_config, command_id))

        return CommandResult(
            command_id=command_id,
            session_id=session["session_id"],
            command=command_config.command,
            status=CommandStatus.RUNNING,
            started_at=started_at,
            stdout="Command started in background",
            validated=command_config.validate_command
        )

    async def _background_command_execution(self, session: Dict, command_config: CommandExecution, command_id: str):
        """Executar comando em background"""
        # TODO: Implementar execução em background com callback
        pass

    async def _session_timeout_handler(self, session_id: str, timeout: int):
        """Handler para timeout de sessão"""
        await asyncio.sleep(timeout)

        if session_id in self.active_sessions:
            session = self.active_sessions[session_id]

            # Verificar se houve atividade recente
            last_activity = session["last_activity"]
            if (datetime.now() - last_activity).total_seconds() >= timeout:
                await self.close_session(session_id)
                logger.info(f"Sessão {session_id} fechada por timeout")

    async def _get_user_sessions(self, username: str) -> List[str]:
        """Obter sessões de um usuário específico"""
        user_sessions = []
        for session_id, session_data in self.active_sessions.items():
            if session_data["username"] == username and session_data["status"] == SessionStatus.ACTIVE:
                user_sessions.append(session_id)
        return user_sessions