from pydantic import BaseModel, Field
from typing import Dict, Optional, Literal
from datetime import datetime

class SSHConnectionRequest(BaseModel):
    """Requisição para estabelecer conexão SSH"""
    sessionId: str = Field(..., description="ID único da sessão SSH")
    hostname: str = Field(..., description="Endereço do servidor SSH")
    port: int = Field(default=22, description="Porta SSH")
    username: str = Field(..., description="Nome de usuário")
    authType: Literal["password", "key"] = Field(..., description="Tipo de autenticação")
    password: Optional[str] = Field(default=None, description="Senha (se authType = password)")
    privateKey: Optional[str] = Field(default=None, description="Chave privada (se authType = key)")
    passphrase: Optional[str] = Field(default=None, description="Passphrase da chave privada")
    timeout: int = Field(default=30, description="Timeout de conexão em segundos")
    keepalive: int = Field(default=60, description="Intervalo de keepalive em segundos")

class SSHConnectionResponse(BaseModel):
    """Resposta da conexão SSH"""
    success: bool
    sessionId: str
    message: str
    connectionId: Optional[str] = None
    serverInfo: Optional[Dict[str, str]] = None
    connectedAt: datetime

class SSHCommandRequest(BaseModel):
    """Requisição para executar comando SSH"""
    sessionId: str = Field(..., description="ID da sessão SSH")
    command: str = Field(..., description="Comando a ser executado")
    workingDirectory: Optional[str] = Field(default=None, description="Diretório de trabalho")
    environment: Dict[str, str] = Field(default_factory=dict, description="Variáveis de ambiente")
    timeout: int = Field(default=30, description="Timeout em segundos")
    userId: str = Field(..., description="ID do usuário")

class SSHCommandResponse(BaseModel):
    """Resposta da execução de comando SSH"""
    success: bool
    sessionId: str
    command: str
    output: str
    errorOutput: Optional[str] = None
    exitCode: int
    executionTimeMs: int
    workingDirectory: Optional[str] = None
    environment: Dict[str, str]
    executedAt: datetime
    userId: str

class SSHSessionInfo(BaseModel):
    """Informações da sessão SSH"""
    sessionId: str
    hostname: str
    port: int
    username: str
    isConnected: bool
    connectedAt: Optional[datetime] = None
    lastActivity: Optional[datetime] = None
    commandCount: int = 0
    connectionId: Optional[str] = None

class SSHDisconnectRequest(BaseModel):
    """Requisição para desconectar sessão SSH"""
    sessionId: str = Field(..., description="ID da sessão SSH")
    userId: str = Field(..., description="ID do usuário")

class SSHDisconnectResponse(BaseModel):
    """Resposta da desconexão SSH"""
    success: bool
    sessionId: str
    message: str
    disconnectedAt: datetime

class SSHListSessionsResponse(BaseModel):
    """Lista de sessões SSH ativas"""
    sessions: list[SSHSessionInfo]
    totalSessions: int
    activeSessions: int

class SSHHealthResponse(BaseModel):
    """Status de saúde do serviço SSH"""
    status: Literal["healthy", "degraded", "unhealthy"]
    activeSessions: int
    totalConnections: int
    uptimeSeconds: int
    message: str