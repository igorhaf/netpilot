import asyncio
import logging
import time
import uuid
from datetime import datetime
from typing import Dict, Optional, Tuple
import paramiko
import threading
from contextlib import asynccontextmanager

from models.ssh import (
    SSHConnectionRequest, SSHConnectionResponse,
    SSHCommandRequest, SSHCommandResponse,
    SSHSessionInfo, SSHDisconnectRequest, SSHDisconnectResponse,
    SSHListSessionsResponse, SSHHealthResponse
)

logger = logging.getLogger(__name__)

class SSHConnection:
    """Representa uma conexão SSH ativa"""

    def __init__(self, session_id: str, connection_request: SSHConnectionRequest):
        self.session_id = session_id
        self.connection_request = connection_request
        self.client: Optional[paramiko.SSHClient] = None
        self.connected_at: Optional[datetime] = None
        self.last_activity: datetime = datetime.now()
        self.command_count: int = 0
        self.connection_id: str = str(uuid.uuid4())
        self.lock = threading.Lock()

    def is_connected(self) -> bool:
        """Verifica se a conexão está ativa"""
        if not self.client:
            return False
        try:
            transport = self.client.get_transport()
            return transport is not None and transport.is_active()
        except:
            return False

    def update_activity(self):
        """Atualiza timestamp da última atividade"""
        self.last_activity = datetime.now()
        self.command_count += 1

class SSHService:
    """Serviço para gerenciar conexões e comandos SSH"""

    def __init__(self):
        self.connections: Dict[str, SSHConnection] = {}
        self.service_started_at = datetime.now()
        self.cleanup_task: Optional[asyncio.Task] = None
        self.connection_timeout = 30 * 60  # 30 minutos

    async def start_service(self):
        """Inicia o serviço SSH"""
        logger.info("🔌 Iniciando serviço SSH...")

        # Iniciar tarefa de limpeza
        self.cleanup_task = asyncio.create_task(self._cleanup_inactive_connections())

        logger.info("✅ Serviço SSH iniciado")

    async def stop_service(self):
        """Para o serviço SSH"""
        logger.info("🔌 Parando serviço SSH...")

        # Cancelar tarefa de limpeza
        if self.cleanup_task:
            self.cleanup_task.cancel()
            try:
                await self.cleanup_task
            except asyncio.CancelledError:
                pass

        # Fechar todas as conexões
        for connection in list(self.connections.values()):
            await self._disconnect_session(connection.session_id)

        logger.info("✅ Serviço SSH parado")

    async def connect_session(self, request: SSHConnectionRequest) -> SSHConnectionResponse:
        """Estabelece uma nova conexão SSH"""
        try:
            logger.info(f"🔐 Conectando SSH: {request.username}@{request.hostname}:{request.port}")

            # Verificar se já existe conexão ativa
            if request.sessionId in self.connections:
                existing = self.connections[request.sessionId]
                if existing.is_connected():
                    return SSHConnectionResponse(
                        success=True,
                        sessionId=request.sessionId,
                        message="Conexão SSH já existe e está ativa",
                        connectionId=existing.connection_id,
                        connectedAt=existing.connected_at
                    )
                else:
                    # Remover conexão inativa
                    await self._disconnect_session(request.sessionId)

            # Criar nova conexão
            connection = SSHConnection(request.sessionId, request)

            # Configurar cliente SSH
            client = paramiko.SSHClient()
            client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

            # Preparar parâmetros de conexão
            connect_kwargs = {
                'hostname': request.hostname,
                'port': request.port,
                'username': request.username,
                'timeout': request.timeout,
                'allow_agent': False,
                'look_for_keys': False
            }

            # Configurar autenticação
            if request.authType == 'password':
                if not request.password:
                    raise ValueError("Password é obrigatório para authType='password'")
                connect_kwargs['password'] = request.password

            elif request.authType == 'key':
                if not request.privateKey:
                    raise ValueError("Private key é obrigatório para authType='key'")

                # Criar chave privada a partir do string
                from io import StringIO
                private_key_file = StringIO(request.privateKey)

                try:
                    # Tentar diferentes tipos de chave
                    for key_class in [paramiko.RSAKey, paramiko.DSAKey, paramiko.ECDSAKey, paramiko.Ed25519Key]:
                        try:
                            private_key_file.seek(0)
                            pkey = key_class.from_private_key(
                                private_key_file,
                                password=request.passphrase
                            )
                            connect_kwargs['pkey'] = pkey
                            break
                        except:
                            continue
                    else:
                        raise ValueError("Formato de chave privada não suportado")

                except Exception as e:
                    raise ValueError(f"Erro ao processar chave privada: {str(e)}")

            # Estabelecer conexão
            await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: client.connect(**connect_kwargs)
            )

            # Verificar se a conexão foi estabelecida
            if not client.get_transport() or not client.get_transport().is_active():
                raise Exception("Falha ao estabelecer conexão SSH")

            # Obter informações do servidor
            server_info = await self._get_server_info(client)

            # Salvar conexão
            connection.client = client
            connection.connected_at = datetime.now()
            self.connections[request.sessionId] = connection

            logger.info(f"✅ SSH conectado: {request.username}@{request.hostname} (session: {request.sessionId})")

            return SSHConnectionResponse(
                success=True,
                sessionId=request.sessionId,
                message=f"Conectado com sucesso a {request.hostname}",
                connectionId=connection.connection_id,
                serverInfo=server_info,
                connectedAt=connection.connected_at
            )

        except Exception as e:
            logger.error(f"❌ Erro ao conectar SSH: {str(e)}")
            return SSHConnectionResponse(
                success=False,
                sessionId=request.sessionId,
                message=f"Erro na conexão SSH: {str(e)}",
                connectedAt=datetime.now()
            )

    async def execute_command(self, request: SSHCommandRequest) -> SSHCommandResponse:
        """Executa um comando via SSH"""
        start_time = time.time()

        try:
            logger.info(f"⚡ Executando SSH: {request.command} (session: {request.sessionId})")

            # Buscar conexão
            connection = self.connections.get(request.sessionId)
            if not connection:
                raise Exception(f"Sessão SSH não encontrada: {request.sessionId}")

            if not connection.is_connected():
                raise Exception(f"Sessão SSH não está conectada: {request.sessionId}")

            # Preparar comando completo
            full_command = self._prepare_command(
                request.command,
                request.workingDirectory,
                request.environment
            )

            # Executar comando
            output, error_output, exit_code = await self._execute_ssh_command(
                connection.client,
                full_command,
                request.timeout
            )

            # Atualizar atividade
            connection.update_activity()

            execution_time_ms = int((time.time() - start_time) * 1000)

            logger.info(f"✅ SSH executado: exit_code={exit_code}, time={execution_time_ms}ms")

            return SSHCommandResponse(
                success=exit_code == 0,
                sessionId=request.sessionId,
                command=request.command,
                output=output,
                errorOutput=error_output if error_output else None,
                exitCode=exit_code,
                executionTimeMs=execution_time_ms,
                workingDirectory=request.workingDirectory,
                environment=request.environment,
                executedAt=datetime.now(),
                userId=request.userId
            )

        except Exception as e:
            execution_time_ms = int((time.time() - start_time) * 1000)
            logger.error(f"❌ Erro SSH: {str(e)}")

            return SSHCommandResponse(
                success=False,
                sessionId=request.sessionId,
                command=request.command,
                output="",
                errorOutput=str(e),
                exitCode=-1,
                executionTimeMs=execution_time_ms,
                workingDirectory=request.workingDirectory,
                environment=request.environment,
                executedAt=datetime.now(),
                userId=request.userId
            )

    async def disconnect_session(self, request: SSHDisconnectRequest) -> SSHDisconnectResponse:
        """Desconecta uma sessão SSH"""
        try:
            success = await self._disconnect_session(request.sessionId)

            return SSHDisconnectResponse(
                success=success,
                sessionId=request.sessionId,
                message="Sessão SSH desconectada com sucesso" if success else "Sessão não encontrada",
                disconnectedAt=datetime.now()
            )

        except Exception as e:
            logger.error(f"❌ Erro ao desconectar SSH: {str(e)}")
            return SSHDisconnectResponse(
                success=False,
                sessionId=request.sessionId,
                message=f"Erro ao desconectar: {str(e)}",
                disconnectedAt=datetime.now()
            )

    async def list_sessions(self) -> SSHListSessionsResponse:
        """Lista todas as sessões SSH"""
        sessions = []
        active_count = 0

        for session_id, connection in self.connections.items():
            is_connected = connection.is_connected()
            if is_connected:
                active_count += 1

            session_info = SSHSessionInfo(
                sessionId=session_id,
                hostname=connection.connection_request.hostname,
                port=connection.connection_request.port,
                username=connection.connection_request.username,
                isConnected=is_connected,
                connectedAt=connection.connected_at,
                lastActivity=connection.last_activity,
                commandCount=connection.command_count,
                connectionId=connection.connection_id
            )
            sessions.append(session_info)

        return SSHListSessionsResponse(
            sessions=sessions,
            totalSessions=len(sessions),
            activeSessions=active_count
        )

    async def get_service_health(self) -> SSHHealthResponse:
        """Obtém status de saúde do serviço SSH"""
        active_sessions = 0
        total_connections = len(self.connections)

        for connection in self.connections.values():
            if connection.is_connected():
                active_sessions += 1

        uptime_seconds = int((datetime.now() - self.service_started_at).total_seconds())

        # Determinar status
        if active_sessions == 0 and total_connections > 0:
            status = "degraded"
            message = "Sessões criadas mas nenhuma ativa"
        elif active_sessions > 0:
            status = "healthy"
            message = f"{active_sessions} sessões ativas"
        else:
            status = "healthy"
            message = "Serviço operacional, nenhuma sessão ativa"

        return SSHHealthResponse(
            status=status,
            activeSessions=active_sessions,
            totalConnections=total_connections,
            uptimeSeconds=uptime_seconds,
            message=message
        )

    # Métodos privados auxiliares

    def _prepare_command(self, command: str, working_directory: Optional[str], environment: Dict[str, str]) -> str:
        """Prepara comando com diretório e variáveis de ambiente"""
        full_command = command

        # Adicionar mudança de diretório
        if working_directory:
            full_command = f'cd "{working_directory}" && {command}'

        # Adicionar variáveis de ambiente
        if environment:
            env_vars = ' '.join([f'{key}="{value}"' for key, value in environment.items()])
            full_command = f'{env_vars} {full_command}'

        return full_command

    async def _execute_ssh_command(self, client: paramiko.SSHClient, command: str, timeout: int) -> Tuple[str, str, int]:
        """Executa comando SSH e retorna output, error, exit_code"""

        def run_command():
            stdin, stdout, stderr = client.exec_command(command, timeout=timeout)

            # Ler output
            output = stdout.read().decode('utf-8', errors='replace')
            error_output = stderr.read().decode('utf-8', errors='replace')
            exit_code = stdout.channel.recv_exit_status()

            return output, error_output, exit_code

        # Executar em thread separada para não bloquear
        return await asyncio.get_event_loop().run_in_executor(None, run_command)

    async def _get_server_info(self, client: paramiko.SSHClient) -> Dict[str, str]:
        """Obtém informações básicas do servidor"""
        try:
            # Executar comandos básicos para obter info do servidor
            commands = {
                'hostname': 'hostname',
                'os': 'uname -s',
                'kernel': 'uname -r',
                'uptime': 'uptime'
            }

            server_info = {}
            for key, cmd in commands.items():
                try:
                    stdin, stdout, stderr = client.exec_command(cmd, timeout=5)
                    output = stdout.read().decode('utf-8', errors='replace').strip()
                    if output:
                        server_info[key] = output
                except:
                    server_info[key] = 'N/A'

            return server_info

        except Exception as e:
            logger.warning(f"Não foi possível obter informações do servidor: {e}")
            return {"status": "connected"}

    async def _disconnect_session(self, session_id: str) -> bool:
        """Desconecta uma sessão específica"""
        try:
            connection = self.connections.get(session_id)
            if not connection:
                return False

            if connection.client:
                connection.client.close()

            del self.connections[session_id]
            logger.info(f"🔌 Sessão SSH desconectada: {session_id}")
            return True

        except Exception as e:
            logger.error(f"❌ Erro ao desconectar sessão {session_id}: {e}")
            return False

    async def _cleanup_inactive_connections(self):
        """Tarefa em background para limpar conexões inativas"""
        while True:
            try:
                await asyncio.sleep(300)  # Verificar a cada 5 minutos

                now = datetime.now()
                inactive_sessions = []

                for session_id, connection in self.connections.items():
                    # Verificar se conexão está inativa há muito tempo
                    time_since_activity = (now - connection.last_activity).total_seconds()

                    if time_since_activity > self.connection_timeout or not connection.is_connected():
                        inactive_sessions.append(session_id)

                # Remover sessões inativas
                for session_id in inactive_sessions:
                    await self._disconnect_session(session_id)
                    logger.info(f"🧹 Conexão SSH inativa removida: {session_id}")

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"❌ Erro na limpeza de conexões SSH: {e}")

# Instância global do serviço
ssh_service = SSHService()