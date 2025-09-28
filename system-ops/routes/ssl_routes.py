"""
NetPilot System Operations - SSL Routes
Endpoints para operações de SSL/TLS
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any
import logging

from models.ssl import (
    SSLRequest, SSLCertificate, SSLCertificateInfo, SSLRenewal,
    SSLInstallation, SSLValidation
)
from services.ssl_service import SSLService

logger = logging.getLogger(__name__)

router = APIRouter()

# Dependency para obter instância do serviço
def get_ssl_service() -> SSLService:
    return SSLService()

@router.post("/generate-certificate", response_model=Dict[str, Any])
async def generate_certificate(
    ssl_request: SSLRequest,
    service: SSLService = Depends(get_ssl_service)
):
    """Gerar certificado SSL"""
    try:
        return await service.generate_certificate(ssl_request)
    except Exception as e:
        logger.error(f"Erro ao gerar certificado SSL: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/renew-certificate", response_model=Dict[str, Any])
async def renew_certificate(
    renewal: SSLRenewal,
    service: SSLService = Depends(get_ssl_service)
):
    """Renovar certificado SSL"""
    try:
        return await service.renew_certificate(renewal)
    except Exception as e:
        logger.error(f"Erro ao renovar certificado SSL: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/certificate-info/{certificate_path:path}", response_model=SSLCertificateInfo)
async def get_certificate_info(
    certificate_path: str,
    service: SSLService = Depends(get_ssl_service)
):
    """Obter informações detalhadas de um certificado"""
    try:
        # Validar caminho por segurança
        from utils.security import SecurityValidator
        security = SecurityValidator()
        if not security.is_safe_path(certificate_path):
            raise HTTPException(status_code=400, detail="Caminho não permitido")

        return await service.get_certificate_info(certificate_path)
    except Exception as e:
        logger.error(f"Erro ao obter informações do certificado: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/install-certificate", response_model=Dict[str, Any])
async def install_certificate(
    installation: SSLInstallation,
    service: SSLService = Depends(get_ssl_service)
):
    """Instalar certificado nos serviços"""
    try:
        return await service.install_certificate(installation)
    except Exception as e:
        logger.error(f"Erro ao instalar certificado: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/list-certificates", response_model=List[SSLCertificate])
async def list_certificates(service: SSLService = Depends(get_ssl_service)):
    """Listar todos os certificados"""
    try:
        return await service.list_certificates()
    except Exception as e:
        logger.error(f"Erro ao listar certificados: {e}")
        raise HTTPException(status_code=500, detail=str(e))