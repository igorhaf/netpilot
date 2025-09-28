"""
NetPilot System Operations - Nginx Routes
Endpoints para operações do Nginx
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any
import logging

from models.nginx import (
    NginxConfig, NginxStatus, NginxBackup, NginxReload, NginxTestConfig
)
from services.nginx_service import NginxService

logger = logging.getLogger(__name__)

router = APIRouter()

# Dependency para obter instância do serviço
def get_nginx_service() -> NginxService:
    return NginxService()

@router.post("/generate-config", response_model=Dict[str, Any])
async def generate_config(
    config: NginxConfig,
    service: NginxService = Depends(get_nginx_service)
):
    """Gerar configuração do Nginx"""
    try:
        return await service.generate_config(config)
    except Exception as e:
        logger.error(f"Erro ao gerar configuração Nginx: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/reload", response_model=Dict[str, Any])
async def reload_nginx(
    reload_config: NginxReload,
    service: NginxService = Depends(get_nginx_service)
):
    """Recarregar Nginx"""
    try:
        return await service.reload_nginx(reload_config)
    except Exception as e:
        logger.error(f"Erro ao recarregar Nginx: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/test-config", response_model=NginxTestConfig)
async def test_config(service: NginxService = Depends(get_nginx_service)):
    """Testar configuração do Nginx"""
    try:
        return await service.test_config()
    except Exception as e:
        logger.error(f"Erro ao testar configuração Nginx: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/backup-config", response_model=Dict[str, Any])
async def backup_config(
    backup_config: NginxBackup,
    service: NginxService = Depends(get_nginx_service)
):
    """Fazer backup das configurações do Nginx"""
    try:
        return await service.backup_config(backup_config)
    except Exception as e:
        logger.error(f"Erro ao fazer backup Nginx: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/status", response_model=NginxStatus)
async def get_status(service: NginxService = Depends(get_nginx_service)):
    """Obter status do Nginx"""
    try:
        return await service.get_status()
    except Exception as e:
        logger.error(f"Erro ao obter status do Nginx: {e}")
        raise HTTPException(status_code=500, detail=str(e))