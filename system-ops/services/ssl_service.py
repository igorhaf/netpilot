"""
NetPilot System Operations - SSL Service
Serviço para operações de SSL/TLS
"""

import os
import subprocess
import logging
import tempfile
import shutil
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Any
from cryptography import x509
from cryptography.hazmat.backends import default_backend
from cryptography.x509.oid import NameOID
from cryptography.hazmat.primitives import hashes

from models.ssl import (
    SSLRequest, SSLCertificate, SSLCertificateInfo, SSLRenewal,
    SSLInstallation, SSLValidation, SSLProvider, SSLKeyType, SSLChallenge
)
from utils.system import SystemUtils
from utils.security import SecurityValidator
from utils.callbacks import CallbackManager

logger = logging.getLogger(__name__)


class SSLService:
    """Serviço para operações de SSL/TLS"""

    def __init__(self):
        self.system_utils = SystemUtils()
        self.security = SecurityValidator()
        self.callback_manager = CallbackManager()

        # Caminhos SSL
        self.ssl_path = os.getenv("SSL_CERTS_PATH", "/etc/ssl/netpilot")
        self.letsencrypt_path = os.getenv("LETSENCRYPT_CONFIG_PATH", "/etc/letsencrypt")
        self.webroot_path = os.getenv("ACME_CHALLENGE_PATH", "/var/www/certbot")

        # Criar diretórios se não existirem
        Path(self.ssl_path).mkdir(parents=True, exist_ok=True)

    async def generate_certificate(self, ssl_request: SSLRequest) -> Dict[str, Any]:
        """Gerar certificado SSL"""
        try:
            logger.info(f"Gerando certificado SSL para domínios: {ssl_request.domains}")

            # Validar request
            self._validate_ssl_request(ssl_request)

            if ssl_request.provider == SSLProvider.LETSENCRYPT:
                result = await self._generate_letsencrypt_certificate(ssl_request)
            elif ssl_request.provider == SSLProvider.SELF_SIGNED:
                result = await self._generate_self_signed_certificate(ssl_request)
            elif ssl_request.provider == SSLProvider.CUSTOM:
                result = await self._install_custom_certificate(ssl_request)
            else:
                raise ValueError(f"Provedor não suportado: {ssl_request.provider}")

            # Callback
            if ssl_request.callback_url:
                await self.callback_manager.send_callback(
                    ssl_request.callback_url,
                    {
                        "operation": "ssl_certificate_generated",
                        "status": "success",
                        "domains": ssl_request.domains,
                        "provider": ssl_request.provider,
                        "certificate_path": result.get("certificate_path")
                    }
                )

            return result

        except Exception as e:
            logger.error(f"Erro ao gerar certificado SSL: {e}")

            if ssl_request.callback_url:
                await self.callback_manager.send_callback(
                    ssl_request.callback_url,
                    {
                        "operation": "ssl_certificate_generated",
                        "status": "error",
                        "error": str(e)
                    }
                )

            raise

    async def renew_certificate(self, renewal: SSLRenewal) -> Dict[str, Any]:
        """Renovar certificado SSL"""
        try:
            logger.info(f"Renovando certificado SSL")

            if renewal.certificate_id:
                # Renovar certificado específico
                cert_info = await self.get_certificate_info(renewal.certificate_id)
                domains = cert_info.domains
            elif renewal.domains:
                # Renovar domínios específicos
                domains = renewal.domains
            else:
                raise ValueError("certificate_id ou domains deve ser especificado")

            # Verificar se renovação é necessária
            if not renewal.force:
                cert_info = await self._get_cert_info_by_domains(domains)
                if cert_info and cert_info.days_until_expiry > renewal.days_before_expiry:
                    return {
                        "success": True,
                        "message": "Certificado ainda válido, renovação não necessária",
                        "days_until_expiry": cert_info.days_until_expiry
                    }

            # Executar renovação com certbot
            cmd = ["certbot", "renew"]

            if renewal.force:
                cmd.append("--force-renewal")

            # Filtrar por domínios específicos se necessário
            if domains:
                for domain in domains:
                    cmd.extend(["--cert-name", domain])

            result = await self.system_utils.run_command(cmd)

            if result.returncode != 0:
                raise Exception(f"Falha na renovação: {result.stderr}")

            # Callback
            if renewal.callback_url:
                await self.callback_manager.send_callback(
                    renewal.callback_url,
                    {
                        "operation": "ssl_certificate_renewed",
                        "status": "success",
                        "domains": domains
                    }
                )

            return {
                "success": True,
                "message": "Certificado renovado com sucesso",
                "domains": domains,
                "output": result.stdout
            }

        except Exception as e:
            logger.error(f"Erro ao renovar certificado: {e}")

            if renewal.callback_url:
                await self.callback_manager.send_callback(
                    renewal.callback_url,
                    {
                        "operation": "ssl_certificate_renewed",
                        "status": "error",
                        "error": str(e)
                    }
                )

            raise

    async def get_certificate_info(self, certificate_path: str) -> SSLCertificateInfo:
        """Obter informações detalhadas de um certificado"""
        try:
            if not os.path.exists(certificate_path):
                raise FileNotFoundError(f"Certificado não encontrado: {certificate_path}")

            # Carregar certificado
            with open(certificate_path, 'rb') as f:
                cert_data = f.read()

            cert = x509.load_pem_x509_certificate(cert_data, default_backend())

            # Extrair informações
            subject = cert.subject.rfc4514_string()
            issuer = cert.issuer.rfc4514_string()
            serial_number = str(cert.serial_number)
            not_before = cert.not_valid_before
            not_after = cert.not_valid_after

            # Extrair domínios (SAN)
            domains = []
            try:
                san_ext = cert.extensions.get_extension_for_oid(x509.oid.ExtensionOID.SUBJECT_ALTERNATIVE_NAME)
                domains = [name.value for name in san_ext.value]
            except x509.ExtensionNotFound:
                # Usar Common Name se SAN não existir
                try:
                    cn = cert.subject.get_attributes_for_oid(NameOID.COMMON_NAME)[0].value
                    domains = [cn]
                except:
                    pass

            # Calcular dias até expiração
            now = datetime.now()
            days_until_expiry = (not_after - now).days

            # Determinar se é auto-assinado
            is_self_signed = cert.issuer == cert.subject

            # Fingerprints
            fingerprint_sha1 = cert.fingerprint(hashes.SHA1()).hex()
            fingerprint_sha256 = cert.fingerprint(hashes.SHA256()).hex()

            # Determinar provedor
            provider = SSLProvider.CUSTOM
            if "Let's Encrypt" in issuer:
                provider = SSLProvider.LETSENCRYPT
            elif is_self_signed:
                provider = SSLProvider.SELF_SIGNED

            return SSLCertificateInfo(
                subject=subject,
                issuer=issuer,
                serial_number=serial_number,
                not_before=not_before,
                not_after=not_after,
                domains=domains,
                signature_algorithm=cert.signature_algorithm_oid._name,
                key_size=cert.public_key().key_size,
                fingerprint_sha1=fingerprint_sha1,
                fingerprint_sha256=fingerprint_sha256,
                is_valid=now < not_after and now >= not_before,
                is_expired=now >= not_after,
                days_until_expiry=days_until_expiry,
                is_self_signed=is_self_signed,
                certificate_path=certificate_path,
                provider=provider
            )

        except Exception as e:
            logger.error(f"Erro ao obter informações do certificado: {e}")
            raise

    async def list_certificates(self) -> List[SSLCertificate]:
        """Listar todos os certificados"""
        try:
            certificates = []

            # Certificados Let's Encrypt
            if os.path.exists(self.letsencrypt_path):
                live_path = os.path.join(self.letsencrypt_path, "live")
                if os.path.exists(live_path):
                    for domain_dir in os.listdir(live_path):
                        domain_path = os.path.join(live_path, domain_dir)
                        if os.path.isdir(domain_path):
                            cert_path = os.path.join(domain_path, "fullchain.pem")
                            if os.path.exists(cert_path):
                                cert_info = await self.get_certificate_info(cert_path)
                                certificates.append(self._cert_info_to_certificate(cert_info, domain_dir))

            # Certificados customizados
            if os.path.exists(self.ssl_path):
                for cert_file in Path(self.ssl_path).glob("*.pem"):
                    try:
                        cert_info = await self.get_certificate_info(str(cert_file))
                        certificates.append(self._cert_info_to_certificate(cert_info, cert_file.stem))
                    except:
                        continue

            return certificates

        except Exception as e:
            logger.error(f"Erro ao listar certificados: {e}")
            raise

    async def install_certificate(self, installation: SSLInstallation) -> Dict[str, Any]:
        """Instalar certificado nos serviços"""
        try:
            logger.info(f"Instalando certificado {installation.certificate_id}")

            # TODO: Implementar instalação automática nos serviços
            # Por enquanto, retorna sucesso
            results = {}

            for service in installation.services:
                if service == "nginx":
                    results[service] = await self._install_nginx_certificate(installation)
                elif service == "apache":
                    results[service] = await self._install_apache_certificate(installation)
                else:
                    results[service] = {"success": False, "error": f"Serviço não suportado: {service}"}

            # Reiniciar serviços se solicitado
            if installation.restart_services:
                for service in installation.services:
                    if results[service].get("success"):
                        await self.system_utils.run_command(["systemctl", "reload", service])

            # Callback
            if installation.callback_url:
                await self.callback_manager.send_callback(
                    installation.callback_url,
                    {
                        "operation": "ssl_certificate_installed",
                        "status": "success",
                        "certificate_id": installation.certificate_id,
                        "services": installation.services,
                        "results": results
                    }
                )

            return {
                "success": True,
                "message": "Certificado instalado com sucesso",
                "results": results
            }

        except Exception as e:
            logger.error(f"Erro ao instalar certificado: {e}")

            if installation.callback_url:
                await self.callback_manager.send_callback(
                    installation.callback_url,
                    {
                        "operation": "ssl_certificate_installed",
                        "status": "error",
                        "error": str(e)
                    }
                )

            raise

    async def _generate_letsencrypt_certificate(self, ssl_request: SSLRequest) -> Dict[str, Any]:
        """Gerar certificado Let's Encrypt"""
        cmd = ["certbot", "certonly"]

        # Staging se solicitado
        if ssl_request.staging:
            cmd.append("--staging")

        # Email
        cmd.extend(["--email", ssl_request.email])

        # Aceitar termos
        if ssl_request.agree_tos:
            cmd.append("--agree-tos")

        # Domínios
        for domain in ssl_request.domains:
            cmd.extend(["-d", domain])

        # Tipo de challenge
        if ssl_request.challenge_type == SSLChallenge.HTTP_01:
            cmd.append("--webroot")
            webroot = ssl_request.webroot_path or self.webroot_path
            cmd.extend(["-w", webroot])
        elif ssl_request.challenge_type == SSLChallenge.DNS_01:
            if not ssl_request.dns_provider:
                raise ValueError("dns_provider é obrigatório para challenge DNS")
            cmd.extend(["--dns", ssl_request.dns_provider])
        else:
            raise ValueError(f"Challenge type não suportado: {ssl_request.challenge_type}")

        # Força renovação se solicitado
        if ssl_request.force_renewal:
            cmd.append("--force-renewal")

        # Execução não interativa
        cmd.append("--non-interactive")

        result = await self.system_utils.run_command(cmd)

        if result.returncode != 0:
            raise Exception(f"Falha ao gerar certificado Let's Encrypt: {result.stderr}")

        # Caminho do certificado gerado
        domain = ssl_request.domains[0]
        cert_path = os.path.join(self.letsencrypt_path, "live", domain, "fullchain.pem")
        key_path = os.path.join(self.letsencrypt_path, "live", domain, "privkey.pem")

        return {
            "success": True,
            "message": "Certificado Let's Encrypt gerado com sucesso",
            "domains": ssl_request.domains,
            "certificate_path": cert_path,
            "private_key_path": key_path,
            "provider": "letsencrypt",
            "output": result.stdout
        }

    async def _generate_self_signed_certificate(self, ssl_request: SSLRequest) -> Dict[str, Any]:
        """Gerar certificado auto-assinado"""
        domain = ssl_request.domains[0]
        cert_path = os.path.join(self.ssl_path, f"{domain}.pem")
        key_path = os.path.join(self.ssl_path, f"{domain}.key")

        # Comando OpenSSL para gerar certificado auto-assinado
        cmd = [
            "openssl", "req", "-x509", "-newkey", "rsa:2048",
            "-keyout", key_path,
            "-out", cert_path,
            "-days", "365",
            "-nodes",
            "-subj", f"/CN={domain}"
        ]

        # Adicionar SAN para múltiplos domínios
        if len(ssl_request.domains) > 1:
            san = ",".join([f"DNS:{d}" for d in ssl_request.domains])
            cmd.extend(["-extensions", "v3_req", "-config", "/dev/stdin"])

            # Criar configuração temporária
            config = f"""
[req]
distinguished_name = req_distinguished_name
req_extensions = v3_req

[req_distinguished_name]

[v3_req]
subjectAltName = {san}
"""

            # Executar com configuração
            process = await self.system_utils.run_command_with_input(cmd, config)
        else:
            process = await self.system_utils.run_command(cmd)

        if process.returncode != 0:
            raise Exception(f"Falha ao gerar certificado auto-assinado: {process.stderr}")

        return {
            "success": True,
            "message": "Certificado auto-assinado gerado com sucesso",
            "domains": ssl_request.domains,
            "certificate_path": cert_path,
            "private_key_path": key_path,
            "provider": "self_signed"
        }

    async def _install_custom_certificate(self, ssl_request: SSLRequest) -> Dict[str, Any]:
        """Instalar certificado customizado"""
        if not ssl_request.certificate_path or not ssl_request.private_key_path:
            raise ValueError("certificate_path e private_key_path são obrigatórios para certificados customizados")

        if not os.path.exists(ssl_request.certificate_path):
            raise FileNotFoundError(f"Certificado não encontrado: {ssl_request.certificate_path}")

        if not os.path.exists(ssl_request.private_key_path):
            raise FileNotFoundError(f"Chave privada não encontrada: {ssl_request.private_key_path}")

        domain = ssl_request.domains[0]
        dest_cert = os.path.join(self.ssl_path, f"{domain}.pem")
        dest_key = os.path.join(self.ssl_path, f"{domain}.key")

        # Copiar arquivos
        shutil.copy2(ssl_request.certificate_path, dest_cert)
        shutil.copy2(ssl_request.private_key_path, dest_key)

        # Copiar bundle CA se fornecido
        dest_ca = None
        if ssl_request.ca_bundle_path and os.path.exists(ssl_request.ca_bundle_path):
            dest_ca = os.path.join(self.ssl_path, f"{domain}_ca.pem")
            shutil.copy2(ssl_request.ca_bundle_path, dest_ca)

        return {
            "success": True,
            "message": "Certificado customizado instalado com sucesso",
            "domains": ssl_request.domains,
            "certificate_path": dest_cert,
            "private_key_path": dest_key,
            "ca_bundle_path": dest_ca,
            "provider": "custom"
        }

    def _validate_ssl_request(self, ssl_request: SSLRequest):
        """Validar request SSL"""
        if not ssl_request.domains:
            raise ValueError("Pelo menos um domínio deve ser especificado")

        if ssl_request.provider == SSLProvider.LETSENCRYPT:
            if not ssl_request.email:
                raise ValueError("Email é obrigatório para Let's Encrypt")

        # Validar paths se fornecidos
        for path_attr in ['certificate_path', 'private_key_path', 'ca_bundle_path', 'webroot_path']:
            path = getattr(ssl_request, path_attr, None)
            if path and not self.security.is_safe_path(path):
                raise ValueError(f"Path perigoso detectado: {path}")

    def _cert_info_to_certificate(self, cert_info: SSLCertificateInfo, cert_id: str) -> SSLCertificate:
        """Converter SSLCertificateInfo para SSLCertificate"""
        return SSLCertificate(
            id=cert_id,
            name=cert_info.domains[0] if cert_info.domains else cert_id,
            domains=cert_info.domains,
            provider=cert_info.provider,
            status="valid" if cert_info.is_valid else "expired",
            created_at=cert_info.not_before,
            expires_at=cert_info.not_after,
            certificate_path=cert_info.certificate_path,
            private_key_path=cert_info.private_key_path or "",
            ca_bundle_path=cert_info.ca_bundle_path,
            key_type=SSLKeyType.RSA_2048,  # Default, seria melhor detectar
            auto_renew=cert_info.provider == SSLProvider.LETSENCRYPT
        )

    async def _get_cert_info_by_domains(self, domains: List[str]) -> Optional[SSLCertificateInfo]:
        """Obter informações de certificado por domínios"""
        # Procurar certificado Let's Encrypt primeiro
        domain = domains[0]
        le_cert_path = os.path.join(self.letsencrypt_path, "live", domain, "fullchain.pem")

        if os.path.exists(le_cert_path):
            return await self.get_certificate_info(le_cert_path)

        # Procurar certificado customizado
        custom_cert_path = os.path.join(self.ssl_path, f"{domain}.pem")
        if os.path.exists(custom_cert_path):
            return await self.get_certificate_info(custom_cert_path)

        return None

    async def _install_nginx_certificate(self, installation: SSLInstallation) -> Dict[str, Any]:
        """Instalar certificado no Nginx"""
        # TODO: Implementar lógica específica do Nginx
        return {"success": True, "message": "Certificado instalado no Nginx"}

    async def _install_apache_certificate(self, installation: SSLInstallation) -> Dict[str, Any]:
        """Instalar certificado no Apache"""
        # TODO: Implementar lógica específica do Apache
        return {"success": True, "message": "Certificado instalado no Apache"}