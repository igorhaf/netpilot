"""
NetPilot System Operations - SSL Models
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, validator
from datetime import datetime, date
from enum import Enum


class SSLProvider(str, Enum):
    """Provedores de certificado SSL"""
    LETSENCRYPT = "letsencrypt"
    SELF_SIGNED = "self_signed"
    CUSTOM = "custom"


class SSLKeyType(str, Enum):
    """Tipos de chave SSL"""
    RSA_2048 = "rsa2048"
    RSA_4096 = "rsa4096"
    ECDSA_256 = "ecdsa256"
    ECDSA_384 = "ecdsa384"


class SSLChallenge(str, Enum):
    """Tipos de challenge ACME"""
    HTTP_01 = "http-01"
    DNS_01 = "dns-01"
    TLS_ALPN_01 = "tls-alpn-01"


class SSLRequest(BaseModel):
    """Request para gerar certificado SSL"""
    domains: List[str] = Field(..., description="Lista de domínios para o certificado")
    provider: SSLProvider = Field(default=SSLProvider.LETSENCRYPT, description="Provedor do certificado")
    key_type: SSLKeyType = Field(default=SSLKeyType.RSA_2048, description="Tipo de chave")
    challenge_type: SSLChallenge = Field(default=SSLChallenge.HTTP_01, description="Tipo de challenge")

    # Contact information for Let's Encrypt
    email: str = Field(..., description="Email para registro no Let's Encrypt")
    agree_tos: bool = Field(default=True, description="Concordar com termos de serviço")

    # Advanced options
    staging: bool = Field(default=False, description="Usar ambiente de staging")
    force_renewal: bool = Field(default=False, description="Forçar renovação se certificado já existe")
    webroot_path: Optional[str] = Field(None, description="Caminho webroot para challenge HTTP")

    # DNS challenge options
    dns_provider: Optional[str] = Field(None, description="Provedor DNS para challenge DNS")
    dns_credentials: Optional[Dict[str, str]] = Field(None, description="Credenciais DNS")

    # Custom certificate options (for provider=custom)
    certificate_path: Optional[str] = Field(None, description="Caminho do certificado customizado")
    private_key_path: Optional[str] = Field(None, description="Caminho da chave privada")
    ca_bundle_path: Optional[str] = Field(None, description="Caminho do bundle CA")

    # Callback
    callback_url: Optional[str] = Field(None, description="URL para callback após operação")

    @validator('domains')
    def validate_domains(cls, v):
        if not v:
            raise ValueError("Pelo menos um domínio deve ser especificado")
        # Validate domain format
        import re
        domain_pattern = re.compile(
            r'^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)*[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$'
        )
        for domain in v:
            if not domain_pattern.match(domain):
                raise ValueError(f"Formato de domínio inválido: {domain}")
        return v


class SSLCertificateInfo(BaseModel):
    """Informações detalhadas de um certificado SSL"""
    subject: str = Field(..., description="Subject do certificado")
    issuer: str = Field(..., description="Emissor do certificado")
    serial_number: str = Field(..., description="Número serial")
    not_before: datetime = Field(..., description="Data de início da validade")
    not_after: datetime = Field(..., description="Data de expiração")
    domains: List[str] = Field(..., description="Domínios cobertos pelo certificado")
    signature_algorithm: str = Field(..., description="Algoritmo de assinatura")
    key_size: int = Field(..., description="Tamanho da chave em bits")
    fingerprint_sha1: str = Field(..., description="Fingerprint SHA1")
    fingerprint_sha256: str = Field(..., description="Fingerprint SHA256")

    # Status
    is_valid: bool = Field(..., description="Certificado é válido")
    is_expired: bool = Field(..., description="Certificado está expirado")
    days_until_expiry: int = Field(..., description="Dias até expiração")
    is_self_signed: bool = Field(..., description="Certificado é auto-assinado")

    # File paths
    certificate_path: str = Field(..., description="Caminho do arquivo de certificado")
    private_key_path: Optional[str] = Field(None, description="Caminho da chave privada")
    ca_bundle_path: Optional[str] = Field(None, description="Caminho do bundle CA")

    # Provider info
    provider: SSLProvider = Field(..., description="Provedor do certificado")
    acme_account: Optional[str] = Field(None, description="Conta ACME (para Let's Encrypt)")


class SSLCertificate(BaseModel):
    """Modelo de certificado SSL"""
    id: str = Field(..., description="ID único do certificado")
    name: str = Field(..., description="Nome do certificado")
    domains: List[str] = Field(..., description="Domínios cobertos")
    provider: SSLProvider = Field(..., description="Provedor")
    status: str = Field(..., description="Status do certificado")
    created_at: datetime = Field(..., description="Data de criação")
    expires_at: datetime = Field(..., description="Data de expiração")
    auto_renew: bool = Field(default=True, description="Renovação automática ativada")

    # File paths
    certificate_path: str = Field(..., description="Caminho do certificado")
    private_key_path: str = Field(..., description="Caminho da chave privada")
    ca_bundle_path: Optional[str] = Field(None, description="Caminho do bundle CA")

    # Metadata
    key_type: SSLKeyType = Field(..., description="Tipo de chave")
    challenge_type: Optional[SSLChallenge] = Field(None, description="Tipo de challenge usado")
    last_renewal: Optional[datetime] = Field(None, description="Última renovação")
    renewal_attempts: int = Field(default=0, description="Tentativas de renovação")


class SSLRenewal(BaseModel):
    """Request para renovação de certificado"""
    certificate_id: Optional[str] = Field(None, description="ID do certificado a renovar")
    domains: Optional[List[str]] = Field(None, description="Domínios específicos a renovar")
    force: bool = Field(default=False, description="Forçar renovação mesmo se não necessário")
    days_before_expiry: int = Field(default=30, description="Renovar X dias antes do vencimento")
    callback_url: Optional[str] = Field(None, description="URL para callback")


class SSLInstallation(BaseModel):
    """Request para instalação de certificado"""
    certificate_id: str = Field(..., description="ID do certificado")
    services: List[str] = Field(default=["nginx"], description="Serviços para instalar certificado")
    nginx_sites: Optional[List[str]] = Field(None, description="Sites Nginx específicos")
    apache_sites: Optional[List[str]] = Field(None, description="Sites Apache específicos")
    restart_services: bool = Field(default=True, description="Reiniciar serviços após instalação")
    callback_url: Optional[str] = Field(None, description="URL para callback")


class SSLValidation(BaseModel):
    """Resultado de validação SSL"""
    domain: str = Field(..., description="Domínio validado")
    valid: bool = Field(..., description="SSL é válido")
    certificate_info: Optional[SSLCertificateInfo] = Field(None, description="Informações do certificado")
    errors: List[str] = Field(default_factory=list, description="Erros encontrados")
    warnings: List[str] = Field(default_factory=list, description="Avisos")
    chain_valid: bool = Field(..., description="Cadeia de certificados é válida")
    ocsp_valid: bool = Field(..., description="OCSP é válido")
    tested_at: datetime = Field(default_factory=datetime.now, description="Data do teste")


class SSLMonitoring(BaseModel):
    """Configuração de monitoramento SSL"""
    enabled: bool = Field(default=True, description="Monitoramento ativo")
    check_interval_hours: int = Field(default=24, description="Intervalo de verificação em horas")
    warning_days: int = Field(default=30, description="Avisar X dias antes do vencimento")
    critical_days: int = Field(default=7, description="Crítico X dias antes do vencimento")
    notification_webhook: Optional[str] = Field(None, description="Webhook para notificações")
    auto_renew: bool = Field(default=True, description="Renovação automática")
    auto_install: bool = Field(default=True, description="Instalação automática após renovação")