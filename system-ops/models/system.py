"""
NetPilot System Operations - System Models
"""

from typing import List, Optional, Dict, Any, Union
from pydantic import BaseModel, Field
from datetime import datetime
from enum import Enum


class ServiceType(str, Enum):
    """Tipos de serviço do sistema"""
    NGINX = "nginx"
    APACHE = "apache2"
    MYSQL = "mysql"
    POSTGRESQL = "postgresql"
    REDIS = "redis"
    DOCKER = "docker"
    SSH = "ssh"
    UFW = "ufw"
    FAIL2BAN = "fail2ban"
    CERTBOT = "certbot"
    NETPILOT_BACKEND = "netpilot-backend"
    NETPILOT_FRONTEND = "netpilot-frontend"
    CUSTOM = "custom"


class LogLevel(str, Enum):
    """Níveis de log"""
    DEBUG = "debug"
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"


class TrafficAction(str, Enum):
    """Ações de tráfego"""
    ALLOW = "allow"
    DENY = "deny"
    BLOCK = "block"
    RATE_LIMIT = "rate_limit"
    REDIRECT = "redirect"


class SystemHealth(BaseModel):
    """Health check do sistema"""
    status: str = Field(..., description="Status geral do sistema")
    timestamp: datetime = Field(default_factory=datetime.now, description="Timestamp do check")

    # System info
    hostname: str = Field(..., description="Nome do host")
    uptime: str = Field(..., description="Uptime do sistema")
    load_average: List[float] = Field(..., description="Load average (1m, 5m, 15m)")

    # Services status
    services: Dict[str, bool] = Field(default_factory=dict, description="Status dos serviços")
    critical_services_down: List[str] = Field(default_factory=list, description="Serviços críticos fora do ar")

    # System resources
    cpu_usage: float = Field(..., description="Uso de CPU (%)")
    memory_usage: float = Field(..., description="Uso de memória (%)")
    disk_usage: float = Field(..., description="Uso de disco (%)")

    # Network
    network_interfaces: Dict[str, Dict[str, Any]] = Field(default_factory=dict, description="Interfaces de rede")

    # Alerts
    alerts: List[str] = Field(default_factory=list, description="Alertas ativos")
    warnings: List[str] = Field(default_factory=list, description="Avisos")

    # Health score (0-100)
    health_score: int = Field(..., description="Score de saúde do sistema")


class SystemResources(BaseModel):
    """Recursos do sistema"""
    timestamp: datetime = Field(default_factory=datetime.now, description="Timestamp da coleta")

    # CPU
    cpu_count: int = Field(..., description="Número de CPUs")
    cpu_usage_per_core: List[float] = Field(..., description="Uso por core")
    cpu_frequency: Dict[str, float] = Field(..., description="Frequência atual/max/min")
    cpu_temperature: Optional[float] = Field(None, description="Temperatura da CPU")

    # Memory
    memory_total: int = Field(..., description="Memória total (bytes)")
    memory_available: int = Field(..., description="Memória disponível (bytes)")
    memory_used: int = Field(..., description="Memória usada (bytes)")
    memory_cached: int = Field(..., description="Memória em cache (bytes)")
    swap_total: int = Field(..., description="Swap total (bytes)")
    swap_used: int = Field(..., description="Swap usado (bytes)")

    # Disk
    disk_partitions: List[Dict[str, Any]] = Field(..., description="Partições de disco")
    disk_io: Dict[str, Any] = Field(..., description="I/O de disco")

    # Network
    network_interfaces: List[Dict[str, Any]] = Field(..., description="Interfaces de rede")
    network_io: Dict[str, Any] = Field(..., description="I/O de rede")

    # Processes
    process_count: int = Field(..., description="Número de processos")
    top_processes: List[Dict[str, Any]] = Field(..., description="Processos que mais consomem recursos")


class ServiceStatus(BaseModel):
    """Status de um serviço"""
    name: str = Field(..., description="Nome do serviço")
    type: ServiceType = Field(..., description="Tipo do serviço")
    running: bool = Field(..., description="Serviço está rodando")
    enabled: bool = Field(..., description="Serviço está habilitado")
    pid: Optional[int] = Field(None, description="PID do processo principal")
    uptime: Optional[str] = Field(None, description="Tempo de atividade")
    memory_usage: Optional[float] = Field(None, description="Uso de memória (MB)")
    cpu_usage: Optional[float] = Field(None, description="Uso de CPU (%)")

    # Status details
    status: str = Field(..., description="Status detalhado")
    sub_state: Optional[str] = Field(None, description="Sub-estado")
    load_state: Optional[str] = Field(None, description="Estado de carregamento")
    active_state: Optional[str] = Field(None, description="Estado ativo")

    # Configuration
    config_path: Optional[str] = Field(None, description="Caminho do arquivo de configuração")
    log_path: Optional[str] = Field(None, description="Caminho do arquivo de log")

    # Health
    health_check: Optional[bool] = Field(None, description="Health check passou")
    last_restart: Optional[datetime] = Field(None, description="Último restart")
    restart_count: int = Field(default=0, description="Número de restarts")


class ServiceRestart(BaseModel):
    """Request para reiniciar serviço"""
    service_name: str = Field(..., description="Nome do serviço")
    service_type: ServiceType = Field(..., description="Tipo do serviço")
    graceful: bool = Field(default=True, description="Restart graceful")
    timeout: int = Field(default=30, description="Timeout em segundos")
    callback_url: Optional[str] = Field(None, description="URL para callback")


class SystemLogs(BaseModel):
    """Request para obter logs do sistema"""
    service: Optional[str] = Field(None, description="Serviço específico")
    lines: int = Field(default=100, description="Número de linhas")
    level: Optional[LogLevel] = Field(None, description="Filtrar por nível de log")
    since: Optional[datetime] = Field(None, description="Logs desde data específica")
    until: Optional[datetime] = Field(None, description="Logs até data específica")
    grep: Optional[str] = Field(None, description="Filtrar por texto")
    follow: bool = Field(default=False, description="Seguir logs em tempo real")


class LogEntry(BaseModel):
    """Entrada de log"""
    timestamp: datetime = Field(..., description="Timestamp da entrada")
    service: str = Field(..., description="Serviço que gerou o log")
    level: LogLevel = Field(..., description="Nível do log")
    message: str = Field(..., description="Mensagem do log")
    hostname: str = Field(..., description="Hostname")
    pid: Optional[int] = Field(None, description="PID do processo")
    unit: Optional[str] = Field(None, description="Unidade systemd")


class TrafficRule(BaseModel):
    """Regra de tráfego"""
    rule_id: Optional[str] = Field(None, description="ID da regra")
    name: str = Field(..., description="Nome da regra")
    action: TrafficAction = Field(..., description="Ação da regra")

    # Source/Destination
    source_ip: Optional[str] = Field(None, description="IP de origem")
    source_port: Optional[int] = Field(None, description="Porta de origem")
    destination_ip: Optional[str] = Field(None, description="IP de destino")
    destination_port: Optional[int] = Field(None, description="Porta de destino")

    # Protocol
    protocol: str = Field(default="tcp", description="Protocolo (tcp, udp, icmp)")

    # Rate limiting
    rate_limit: Optional[Dict[str, Any]] = Field(None, description="Configuração de rate limiting")

    # Redirect
    redirect_to: Optional[str] = Field(None, description="Endereço para redirecionamento")

    # Metadata
    priority: int = Field(default=100, description="Prioridade da regra")
    enabled: bool = Field(default=True, description="Regra ativa")
    comment: Optional[str] = Field(None, description="Comentário")
    expires_at: Optional[datetime] = Field(None, description="Data de expiração")


class TrafficStats(BaseModel):
    """Estatísticas de tráfego"""
    timestamp: datetime = Field(default_factory=datetime.now, description="Timestamp das estatísticas")

    # Connection stats
    total_connections: int = Field(..., description="Total de conexões")
    active_connections: int = Field(..., description="Conexões ativas")
    connections_per_second: float = Field(..., description="Conexões por segundo")

    # Bandwidth
    bytes_in: int = Field(..., description="Bytes recebidos")
    bytes_out: int = Field(..., description="Bytes enviados")
    bandwidth_in_mbps: float = Field(..., description="Largura de banda entrada (Mbps)")
    bandwidth_out_mbps: float = Field(..., description="Largura de banda saída (Mbps)")

    # Top IPs
    top_source_ips: List[Dict[str, Any]] = Field(..., description="IPs de origem mais ativos")
    top_destination_ports: List[Dict[str, Any]] = Field(..., description="Portas de destino mais acessadas")

    # Blocked traffic
    blocked_requests: int = Field(default=0, description="Requisições bloqueadas")
    rate_limited_requests: int = Field(default=0, description="Requisições limitadas")


class CallbackRequest(BaseModel):
    """Request de callback para o NestJS"""
    operation: str = Field(..., description="Operação realizada")
    status: str = Field(..., description="Status da operação")
    data: Dict[str, Any] = Field(default_factory=dict, description="Dados da operação")
    timestamp: datetime = Field(default_factory=datetime.now, description="Timestamp da operação")
    execution_time: Optional[float] = Field(None, description="Tempo de execução")
    error_message: Optional[str] = Field(None, description="Mensagem de erro se houver")


class OperationResponse(BaseModel):
    """Resposta padrão de operações"""
    success: bool = Field(..., description="Operação bem-sucedida")
    message: str = Field(..., description="Mensagem da operação")
    data: Optional[Dict[str, Any]] = Field(None, description="Dados de retorno")
    operation_id: Optional[str] = Field(None, description="ID da operação")
    timestamp: datetime = Field(default_factory=datetime.now, description="Timestamp da resposta")
    execution_time: Optional[float] = Field(None, description="Tempo de execução")


class SystemAlert(BaseModel):
    """Alerta do sistema"""
    alert_id: str = Field(..., description="ID do alerta")
    type: str = Field(..., description="Tipo do alerta")
    severity: str = Field(..., description="Severidade (low, medium, high, critical)")
    title: str = Field(..., description="Título do alerta")
    message: str = Field(..., description="Mensagem do alerta")
    source: str = Field(..., description="Origem do alerta")
    timestamp: datetime = Field(default_factory=datetime.now, description="Timestamp do alerta")
    resolved: bool = Field(default=False, description="Alerta resolvido")
    resolved_at: Optional[datetime] = Field(None, description="Timestamp da resolução")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Metadados do alerta")