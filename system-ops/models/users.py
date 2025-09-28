"""
NetPilot System Operations - User Management Models
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, validator
from datetime import datetime
from enum import Enum


class UserType(str, Enum):
    """Tipos de usuário do sistema"""
    SYSTEM = "system"
    SFTP = "sftp"
    SSH = "ssh"
    WEB = "web"
    SERVICE = "service"


class SessionStatus(str, Enum):
    """Status de sessão terminal"""
    ACTIVE = "active"
    INACTIVE = "inactive"
    TERMINATED = "terminated"
    EXPIRED = "expired"


class CommandStatus(str, Enum):
    """Status de execução de comando"""
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    TIMEOUT = "timeout"
    CANCELLED = "cancelled"


class SystemUser(BaseModel):
    """Request para criar usuário do sistema"""
    username: str = Field(..., description="Nome do usuário", min_length=3, max_length=32)
    user_type: UserType = Field(..., description="Tipo de usuário")
    home_directory: Optional[str] = Field(None, description="Diretório home customizado")
    shell: str = Field(default="/bin/bash", description="Shell do usuário")

    # SSH Configuration
    ssh_key: Optional[str] = Field(None, description="Chave SSH pública")
    ssh_port: int = Field(default=22, description="Porta SSH")
    password_auth: bool = Field(default=False, description="Permitir autenticação por senha")

    # SFTP Configuration
    sftp_chroot: bool = Field(default=True, description="Ativar chroot para SFTP")
    sftp_directories: List[str] = Field(default_factory=list, description="Diretórios permitidos para SFTP")

    # Permissions
    groups: List[str] = Field(default_factory=list, description="Grupos do usuário")
    sudo_access: bool = Field(default=False, description="Acesso sudo")
    allowed_commands: List[str] = Field(default_factory=list, description="Comandos permitidos")

    # Restrictions
    login_allowed: bool = Field(default=True, description="Permitir login")
    max_sessions: int = Field(default=5, description="Máximo de sessões simultâneas")
    session_timeout: int = Field(default=3600, description="Timeout de sessão em segundos")

    # Expiration
    expires_at: Optional[datetime] = Field(None, description="Data de expiração do usuário")

    # Callback
    callback_url: Optional[str] = Field(None, description="URL para callback")

    @validator('username')
    def validate_username(cls, v):
        import re
        if not re.match(r'^[a-z_][a-z0-9_-]*$', v):
            raise ValueError("Nome de usuário deve conter apenas letras minúsculas, números, _ e -")
        if v in ['root', 'admin', 'administrator', 'nginx', 'www-data']:
            raise ValueError("Nome de usuário reservado")
        return v


class TerminalSession(BaseModel):
    """Request para criar sessão terminal"""
    username: str = Field(..., description="Nome do usuário")
    session_type: str = Field(default="bash", description="Tipo de sessão (bash, sh, python, etc)")
    working_directory: Optional[str] = Field(None, description="Diretório de trabalho inicial")
    environment_vars: Dict[str, str] = Field(default_factory=dict, description="Variáveis de ambiente")
    timeout: int = Field(default=3600, description="Timeout da sessão em segundos")

    # SSH Session
    ssh_host: Optional[str] = Field(None, description="Host SSH (para sessões remotas)")
    ssh_port: int = Field(default=22, description="Porta SSH")
    ssh_key_path: Optional[str] = Field(None, description="Caminho da chave SSH")

    # Security
    restricted_mode: bool = Field(default=True, description="Modo restrito")
    allowed_commands: List[str] = Field(default_factory=list, description="Comandos permitidos")
    log_commands: bool = Field(default=True, description="Logar comandos executados")

    # Callback
    callback_url: Optional[str] = Field(None, description="URL para callback de eventos")


class CommandExecution(BaseModel):
    """Request para executar comando"""
    session_id: str = Field(..., description="ID da sessão")
    command: str = Field(..., description="Comando a executar")
    timeout: int = Field(default=300, description="Timeout em segundos")
    working_directory: Optional[str] = Field(None, description="Diretório de trabalho")
    environment_vars: Dict[str, str] = Field(default_factory=dict, description="Variáveis de ambiente")

    # Security
    validate_command: bool = Field(default=True, description="Validar comando antes da execução")
    log_output: bool = Field(default=True, description="Logar output do comando")

    # Async execution
    async_execution: bool = Field(default=False, description="Execução assíncrona")
    callback_url: Optional[str] = Field(None, description="URL para callback")

    @validator('command')
    def validate_command(cls, v):
        # Basic command validation
        dangerous_commands = ['rm -rf /', 'dd if=', 'mkfs', 'fdisk', 'format']
        for dangerous in dangerous_commands:
            if dangerous in v.lower():
                raise ValueError(f"Comando perigoso detectado: {dangerous}")
        return v


class SessionInfo(BaseModel):
    """Informações de uma sessão terminal"""
    session_id: str = Field(..., description="ID da sessão")
    username: str = Field(..., description="Nome do usuário")
    session_type: str = Field(..., description="Tipo de sessão")
    status: SessionStatus = Field(..., description="Status da sessão")
    created_at: datetime = Field(..., description="Data de criação")
    last_activity: datetime = Field(..., description="Última atividade")
    working_directory: str = Field(..., description="Diretório atual")
    pid: Optional[int] = Field(None, description="PID do processo")

    # Statistics
    commands_executed: int = Field(default=0, description="Comandos executados")
    total_runtime: int = Field(default=0, description="Tempo total de execução")

    # Connection info
    remote_ip: Optional[str] = Field(None, description="IP remoto")
    ssh_host: Optional[str] = Field(None, description="Host SSH")

    # Security
    restricted_mode: bool = Field(..., description="Modo restrito ativo")
    violations: int = Field(default=0, description="Violações de segurança")


class SessionList(BaseModel):
    """Lista de sessões ativas"""
    sessions: List[SessionInfo] = Field(..., description="Lista de sessões")
    total_sessions: int = Field(..., description="Total de sessões")
    active_sessions: int = Field(..., description="Sessões ativas")
    users_connected: int = Field(..., description="Usuários conectados")


class CommandResult(BaseModel):
    """Resultado de execução de comando"""
    command_id: str = Field(..., description="ID do comando")
    session_id: str = Field(..., description="ID da sessão")
    command: str = Field(..., description="Comando executado")
    status: CommandStatus = Field(..., description="Status da execução")

    # Execution details
    started_at: datetime = Field(..., description="Início da execução")
    completed_at: Optional[datetime] = Field(None, description="Fim da execução")
    execution_time: Optional[float] = Field(None, description="Tempo de execução em segundos")

    # Output
    stdout: str = Field(default="", description="Output padrão")
    stderr: str = Field(default="", description="Output de erro")
    exit_code: Optional[int] = Field(None, description="Código de saída")

    # Security
    validated: bool = Field(..., description="Comando foi validado")
    violations: List[str] = Field(default_factory=list, description="Violações detectadas")


class UserActivity(BaseModel):
    """Atividade do usuário"""
    username: str = Field(..., description="Nome do usuário")
    activity_type: str = Field(..., description="Tipo de atividade")
    timestamp: datetime = Field(..., description="Timestamp da atividade")
    session_id: Optional[str] = Field(None, description="ID da sessão")
    command: Optional[str] = Field(None, description="Comando executado")
    result: Optional[str] = Field(None, description="Resultado da atividade")
    ip_address: Optional[str] = Field(None, description="Endereço IP")
    user_agent: Optional[str] = Field(None, description="User agent")


class UserSession(BaseModel):
    """Informações completas da sessão do usuário"""
    session_info: SessionInfo = Field(..., description="Informações da sessão")
    recent_commands: List[CommandResult] = Field(default_factory=list, description="Comandos recentes")
    system_resources: Dict[str, Any] = Field(default_factory=dict, description="Recursos do sistema")
    security_alerts: List[str] = Field(default_factory=list, description="Alertas de segurança")