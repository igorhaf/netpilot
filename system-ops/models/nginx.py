"""
NetPilot System Operations - Nginx Models
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, validator
from datetime import datetime


class NginxUpstream(BaseModel):
    """Configuração de upstream para load balancing"""
    name: str = Field(..., description="Nome do upstream")
    servers: List[str] = Field(..., description="Lista de servidores backend")
    method: str = Field(default="round_robin", description="Método de balanceamento")
    health_check: bool = Field(default=True, description="Ativar health check")


class NginxLocation(BaseModel):
    """Configuração de location para Nginx"""
    path: str = Field(..., description="Caminho da location")
    proxy_pass: Optional[str] = Field(None, description="URL de proxy_pass")
    upstream: Optional[str] = Field(None, description="Nome do upstream")
    root: Optional[str] = Field(None, description="Diretório root")
    index: Optional[str] = Field(None, description="Arquivo index")
    try_files: Optional[str] = Field(None, description="Configuração try_files")
    headers: Dict[str, str] = Field(default_factory=dict, description="Headers customizados")
    custom_config: List[str] = Field(default_factory=list, description="Configurações customizadas")


class NginxSSL(BaseModel):
    """Configuração SSL para Nginx"""
    certificate_path: str = Field(..., description="Caminho do certificado")
    certificate_key_path: str = Field(..., description="Caminho da chave privada")
    protocols: List[str] = Field(default=["TLSv1.2", "TLSv1.3"], description="Protocolos SSL")
    ciphers: Optional[str] = Field(None, description="Ciphers SSL")
    hsts: bool = Field(default=True, description="Ativar HSTS")
    ocsp_stapling: bool = Field(default=True, description="Ativar OCSP stapling")


class NginxSite(BaseModel):
    """Configuração completa de um site Nginx"""
    server_name: str = Field(..., description="Nome do servidor")
    domains: List[str] = Field(..., description="Lista de domínios")
    listen_ports: List[int] = Field(default=[80], description="Portas de escuta")
    root: Optional[str] = Field(None, description="Diretório root do site")
    index: str = Field(default="index.html index.htm", description="Arquivos index")

    # SSL Configuration
    ssl: Optional[NginxSSL] = Field(None, description="Configuração SSL")
    force_https: bool = Field(default=False, description="Forçar redirecionamento HTTPS")

    # Locations
    locations: List[NginxLocation] = Field(default_factory=list, description="Configurações de location")

    # Upstreams
    upstreams: List[NginxUpstream] = Field(default_factory=list, description="Configurações de upstream")

    # Logging
    access_log: str = Field(default="/var/log/nginx/access.log", description="Arquivo de log de acesso")
    error_log: str = Field(default="/var/log/nginx/error.log", description="Arquivo de log de erro")

    # Security
    rate_limiting: Optional[Dict[str, Any]] = Field(None, description="Configuração de rate limiting")
    ip_whitelist: List[str] = Field(default_factory=list, description="Lista de IPs permitidos")
    ip_blacklist: List[str] = Field(default_factory=list, description="Lista de IPs bloqueados")

    # Custom Configuration
    custom_config: List[str] = Field(default_factory=list, description="Configurações customizadas")

    @validator('domains')
    def validate_domains(cls, v):
        if not v:
            raise ValueError("Pelo menos um domínio deve ser especificado")
        return v


class NginxConfig(BaseModel):
    """Request para gerar configuração Nginx"""
    site: NginxSite = Field(..., description="Configuração do site")
    template: str = Field(default="default", description="Template a ser usado")
    enabled: bool = Field(default=True, description="Ativar site após criação")
    backup_existing: bool = Field(default=True, description="Fazer backup da configuração existente")
    callback_url: Optional[str] = Field(None, description="URL para callback após operação")


class NginxStatus(BaseModel):
    """Status do serviço Nginx"""
    running: bool = Field(..., description="Nginx está rodando")
    pid: Optional[int] = Field(None, description="PID do processo principal")
    version: str = Field(..., description="Versão do Nginx")
    config_test: bool = Field(..., description="Teste de configuração passou")
    sites_enabled: int = Field(..., description="Número de sites ativos")
    sites_available: int = Field(..., description="Número de sites disponíveis")
    uptime: Optional[str] = Field(None, description="Tempo de atividade")
    workers: int = Field(..., description="Número de workers")
    connections: Dict[str, int] = Field(default_factory=dict, description="Estatísticas de conexão")
    last_reload: Optional[datetime] = Field(None, description="Último reload")


class NginxBackup(BaseModel):
    """Configuração de backup do Nginx"""
    backup_path: str = Field(..., description="Caminho do backup")
    include_sites: bool = Field(default=True, description="Incluir sites disponíveis")
    include_configs: bool = Field(default=True, description="Incluir configurações")
    include_logs: bool = Field(default=False, description="Incluir logs")
    compression: bool = Field(default=True, description="Comprimir backup")
    retention_days: int = Field(default=30, description="Dias de retenção")


class NginxReload(BaseModel):
    """Request para reload do Nginx"""
    test_config: bool = Field(default=True, description="Testar configuração antes do reload")
    graceful: bool = Field(default=True, description="Reload graceful")
    callback_url: Optional[str] = Field(None, description="URL para callback")


class NginxTestConfig(BaseModel):
    """Resultado do teste de configuração"""
    valid: bool = Field(..., description="Configuração é válida")
    output: str = Field(..., description="Output do teste")
    errors: List[str] = Field(default_factory=list, description="Lista de erros")
    warnings: List[str] = Field(default_factory=list, description="Lista de avisos")
    file_tested: str = Field(..., description="Arquivo testado")