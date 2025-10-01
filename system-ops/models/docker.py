from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any, Literal, Union
from datetime import datetime

# ===========================
# MODELOS DE CONTAINERS
# ===========================

class ContainerPort(BaseModel):
    """Modelo para portas de container"""
    private_port: int = Field(..., description="Porta interna do container")
    public_port: Optional[int] = Field(default=None, description="Porta pública mapeada")
    type: str = Field(default="tcp", description="Tipo de protocolo")

class ContainerMount(BaseModel):
    """Modelo para montagens de container"""
    type: str = Field(..., description="Tipo de montagem")
    source: str = Field(..., description="Origem da montagem")
    destination: str = Field(..., description="Destino da montagem")
    readonly: bool = Field(default=False, description="Somente leitura")

class ContainerInfo(BaseModel):
    """Informações básicas de container"""
    id: str = Field(..., description="ID do container")
    name: str = Field(..., description="Nome do container")
    image: str = Field(..., description="Imagem utilizada")
    image_id: str = Field(..., description="ID da imagem")
    status: str = Field(..., description="Status do container")
    state: str = Field(..., description="Estado do container")
    created: datetime = Field(..., description="Data de criação")
    ports: List[ContainerPort] = Field(default_factory=list, description="Portas mapeadas")
    labels: Dict[str, str] = Field(default_factory=dict, description="Labels do container")
    networks: List[str] = Field(default_factory=list, description="Redes conectadas")
    mounts: List[ContainerMount] = Field(default_factory=list, description="Montagens")

class ContainerInspectInfo(BaseModel):
    """Informações detalhadas de container (inspect)"""
    id: str = Field(..., description="ID do container")
    name: str = Field(..., description="Nome do container")
    config: Dict[str, Any] = Field(..., description="Configuração do container")
    host_config: Dict[str, Any] = Field(..., description="Configuração do host")
    network_settings: Dict[str, Any] = Field(..., description="Configurações de rede")
    state: Dict[str, Any] = Field(..., description="Estado detalhado")
    mounts: List[Dict[str, Any]] = Field(default_factory=list, description="Montagens detalhadas")

class CreateContainerRequest(BaseModel):
    """Requisição para criar container"""
    name: str = Field(..., description="Nome do container")
    image: str = Field(..., description="Imagem a ser utilizada")
    env: Optional[List[str]] = Field(default=None, description="Variáveis de ambiente")
    ports: Optional[Dict[str, List[Dict[str, str]]]] = Field(default=None, description="Mapeamento de portas")
    volumes: Optional[List[Dict[str, Any]]] = Field(default=None, description="Volumes a montar")
    networks: Optional[List[str]] = Field(default=None, description="Redes a conectar")
    command: Optional[Union[str, List[str]]] = Field(default=None, description="Comando a executar")
    working_dir: Optional[str] = Field(default=None, description="Diretório de trabalho")
    restart_policy: Optional[str] = Field(default=None, description="Política de restart")
    auto_remove: bool = Field(default=False, description="Remover automaticamente após parar")

class ContainerActionRequest(BaseModel):
    """Requisição para ação em container"""
    action: Literal["start", "stop", "restart", "pause", "unpause", "kill"] = Field(..., description="Ação a executar")
    force: bool = Field(default=False, description="Forçar ação")
    timeout: Optional[int] = Field(default=10, description="Timeout em segundos")

class ContainerListRequest(BaseModel):
    """Requisição para listar containers"""
    all: bool = Field(default=True, description="Incluir containers parados")
    status: Optional[str] = Field(default=None, description="Filtrar por status")
    image: Optional[str] = Field(default=None, description="Filtrar por imagem")
    name: Optional[str] = Field(default=None, description="Filtrar por nome")
    label: Optional[str] = Field(default=None, description="Filtrar por label")

# ===========================
# MODELOS DE IMAGENS
# ===========================

class ImageInfo(BaseModel):
    """Informações de imagem Docker"""
    id: str = Field(..., description="ID da imagem")
    tags: List[str] = Field(default_factory=list, description="Tags da imagem")
    created: datetime = Field(..., description="Data de criação")
    size: int = Field(..., description="Tamanho da imagem")
    virtual_size: int = Field(..., description="Tamanho virtual")
    parent_id: Optional[str] = Field(default=None, description="ID da imagem pai")
    repo_digests: List[str] = Field(default_factory=list, description="Digests do repositório")

class ImageListRequest(BaseModel):
    """Requisição para listar imagens"""
    all: bool = Field(default=False, description="Incluir imagens intermediárias")
    dangling: Optional[bool] = Field(default=None, description="Filtrar imagens órfãs")
    name: Optional[str] = Field(default=None, description="Filtrar por nome")

class ImagePullRequest(BaseModel):
    """Requisição para fazer pull de imagem"""
    repository: str = Field(..., description="Repositório da imagem")
    tag: str = Field(default="latest", description="Tag da imagem")
    auth: Optional[Dict[str, str]] = Field(default=None, description="Credenciais de autenticação")

class ImageRemoveRequest(BaseModel):
    """Requisição para remover imagem"""
    force: bool = Field(default=False, description="Forçar remoção")
    noprune: bool = Field(default=False, description="Não remover imagens pai")

# ===========================
# MODELOS DE VOLUMES
# ===========================

class VolumeInfo(BaseModel):
    """Informações de volume Docker"""
    name: str = Field(..., description="Nome do volume")
    driver: str = Field(..., description="Driver do volume")
    mountpoint: str = Field(..., description="Ponto de montagem")
    labels: Dict[str, str] = Field(default_factory=dict, description="Labels do volume")
    options: Dict[str, str] = Field(default_factory=dict, description="Opções do volume")
    scope: str = Field(..., description="Escopo do volume")
    created_at: datetime = Field(..., description="Data de criação")

class CreateVolumeRequest(BaseModel):
    """Requisição para criar volume"""
    name: str = Field(..., description="Nome do volume")
    driver: str = Field(default="local", description="Driver do volume")
    driver_opts: Optional[Dict[str, str]] = Field(default=None, description="Opções do driver")
    labels: Optional[Dict[str, str]] = Field(default=None, description="Labels do volume")

class VolumeListRequest(BaseModel):
    """Requisição para listar volumes"""
    dangling: Optional[bool] = Field(default=None, description="Filtrar volumes órfãos")
    driver: Optional[str] = Field(default=None, description="Filtrar por driver")
    label: Optional[str] = Field(default=None, description="Filtrar por label")

# ===========================
# MODELOS DE NETWORKS
# ===========================

class NetworkInfo(BaseModel):
    """Informações de rede Docker"""
    id: str = Field(..., description="ID da rede")
    name: str = Field(..., description="Nome da rede")
    driver: str = Field(..., description="Driver da rede")
    scope: str = Field(..., description="Escopo da rede")
    ipam: Dict[str, Any] = Field(default_factory=dict, description="Configuração IPAM")
    containers: Dict[str, Any] = Field(default_factory=dict, description="Containers conectados")
    options: Dict[str, str] = Field(default_factory=dict, description="Opções da rede")
    labels: Dict[str, str] = Field(default_factory=dict, description="Labels da rede")
    created: datetime = Field(..., description="Data de criação")

class CreateNetworkRequest(BaseModel):
    """Requisição para criar rede"""
    name: str = Field(..., description="Nome da rede")
    driver: str = Field(default="bridge", description="Driver da rede")
    options: Optional[Dict[str, str]] = Field(default=None, description="Opções da rede")
    ipam: Optional[Dict[str, Any]] = Field(default=None, description="Configuração IPAM")
    check_duplicate: bool = Field(default=True, description="Verificar duplicatas")
    internal: bool = Field(default=False, description="Rede interna")
    enable_ipv6: bool = Field(default=False, description="Habilitar IPv6")
    labels: Optional[Dict[str, str]] = Field(default=None, description="Labels da rede")

class NetworkConnectRequest(BaseModel):
    """Requisição para conectar container à rede"""
    container: str = Field(..., description="ID ou nome do container")
    aliases: Optional[List[str]] = Field(default=None, description="Aliases do container")
    ipv4_address: Optional[str] = Field(default=None, description="Endereço IPv4")
    ipv6_address: Optional[str] = Field(default=None, description="Endereço IPv6")

class NetworkDisconnectRequest(BaseModel):
    """Requisição para desconectar container da rede"""
    container: str = Field(..., description="ID ou nome do container")
    force: bool = Field(default=False, description="Forçar desconexão")

# ===========================
# MODELOS DE STATS E LOGS
# ===========================

class ContainerStats(BaseModel):
    """Estatísticas de container"""
    container_id: str = Field(..., description="ID do container")
    cpu_usage: float = Field(..., description="Uso de CPU (%)")
    memory_usage: int = Field(..., description="Uso de memória (bytes)")
    memory_limit: int = Field(..., description="Limite de memória (bytes)")
    memory_percent: float = Field(..., description="Percentual de memória")
    network_rx: int = Field(..., description="Bytes recebidos na rede")
    network_tx: int = Field(..., description="Bytes transmitidos na rede")
    block_read: int = Field(..., description="Bytes lidos do disco")
    block_write: int = Field(..., description="Bytes escritos no disco")
    pids: int = Field(..., description="Número de PIDs")

class LogEntry(BaseModel):
    """Entrada de log de container"""
    timestamp: datetime = Field(..., description="Timestamp do log")
    stream: Literal["stdout", "stderr"] = Field(..., description="Stream de origem")
    message: str = Field(..., description="Mensagem do log")

class LogsRequest(BaseModel):
    """Requisição para obter logs"""
    stdout: bool = Field(default=True, description="Incluir stdout")
    stderr: bool = Field(default=True, description="Incluir stderr")
    timestamps: bool = Field(default=True, description="Incluir timestamps")
    tail: Optional[int] = Field(default=None, description="Últimas N linhas")
    since: Optional[str] = Field(default=None, description="Logs desde timestamp")
    until: Optional[str] = Field(default=None, description="Logs até timestamp")
    follow: bool = Field(default=False, description="Seguir logs (stream)")

# ===========================
# MODELOS DE RESPOSTA
# ===========================

class DockerOperationResponse(BaseModel):
    """Resposta padrão de operação Docker"""
    success: bool = Field(..., description="Sucesso da operação")
    message: str = Field(..., description="Mensagem de resultado")
    data: Optional[Any] = Field(default=None, description="Dados de retorno")
    operation: str = Field(..., description="Tipo de operação")
    timestamp: datetime = Field(default_factory=datetime.now, description="Timestamp da operação")

class DockerHealthResponse(BaseModel):
    """Status de saúde do serviço Docker"""
    status: Literal["healthy", "degraded", "unhealthy"] = Field(..., description="Status do serviço")
    docker_version: Optional[str] = Field(default=None, description="Versão do Docker")
    containers_running: int = Field(..., description="Containers em execução")
    containers_total: int = Field(..., description="Total de containers")
    images_total: int = Field(..., description="Total de imagens")
    volumes_total: int = Field(..., description="Total de volumes")
    networks_total: int = Field(..., description="Total de redes")
    disk_usage: Optional[Dict[str, Any]] = Field(default=None, description="Uso de disco")
    message: str = Field(..., description="Mensagem de status")

class DockerSystemInfo(BaseModel):
    """Informações do sistema Docker"""
    version: str = Field(..., description="Versão do Docker")
    api_version: str = Field(..., description="Versão da API")
    containers: int = Field(..., description="Total de containers")
    containers_running: int = Field(..., description="Containers rodando")
    containers_paused: int = Field(..., description="Containers pausados")
    containers_stopped: int = Field(..., description="Containers parados")
    images: int = Field(..., description="Total de imagens")
    volumes: int = Field(..., description="Total de volumes")
    networks: int = Field(..., description="Total de redes")
    server_version: str = Field(..., description="Versão do servidor Docker")
    storage_driver: str = Field(..., description="Driver de armazenamento")
    total_memory: int = Field(..., description="Memória total disponível")
    cpu_count: int = Field(..., description="Número de CPUs")
    kernel_version: str = Field(..., description="Versão do kernel")
    operating_system: str = Field(..., description="Sistema operacional")
    architecture: str = Field(..., description="Arquitetura")

# ===========================
# MODELOS DE EXEC
# ===========================

class ContainerExecRequest(BaseModel):
    """Requisição para executar comando em container"""
    cmd: Union[str, List[str]] = Field(..., description="Comando a executar")
    interactive: bool = Field(default=False, description="Modo interativo")
    tty: bool = Field(default=False, description="Alocar TTY")
    env: Optional[List[str]] = Field(default=None, description="Variáveis de ambiente")
    working_dir: Optional[str] = Field(default=None, description="Diretório de trabalho")
    user: Optional[str] = Field(default=None, description="Usuário para execução")

class ContainerExecResponse(BaseModel):
    """Resposta de execução em container"""
    exec_id: str = Field(..., description="ID da execução")
    exit_code: Optional[int] = Field(default=None, description="Código de saída")
    output: str = Field(..., description="Output da execução")
    error: Optional[str] = Field(default=None, description="Erros da execução")