"""
NetPilot System Operations - System Routes
Endpoints para operações gerais do sistema
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any
import logging

from models.system import (
    SystemHealth, SystemResources, ServiceStatus, ServiceRestart,
    SystemLogs, LogEntry, OperationResponse
)
from services.system_service import SystemService

logger = logging.getLogger(__name__)

router = APIRouter()

# Dependency para obter instância do serviço
def get_system_service() -> SystemService:
    return SystemService()

@router.get("/health", response_model=SystemHealth)
async def get_health(service: SystemService = Depends(get_system_service)):
    """Obter health check completo do sistema"""
    try:
        return await service.get_health()
    except Exception as e:
        logger.error(f"Erro ao obter health check: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/resources", response_model=SystemResources)
async def get_resources(service: SystemService = Depends(get_system_service)):
    """Obter recursos detalhados do sistema"""
    try:
        return await service.get_resources()
    except Exception as e:
        logger.error(f"Erro ao obter recursos: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/services/{service_name}/status", response_model=ServiceStatus)
async def get_service_status(
    service_name: str,
    service: SystemService = Depends(get_system_service)
):
    """Obter status de um serviço específico"""
    try:
        return await service.get_service_status(service_name)
    except Exception as e:
        logger.error(f"Erro ao obter status do serviço {service_name}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/services/restart", response_model=OperationResponse)
async def restart_service(
    restart_config: ServiceRestart,
    service: SystemService = Depends(get_system_service)
):
    """Reiniciar um serviço"""
    try:
        return await service.restart_service(restart_config)
    except Exception as e:
        logger.error(f"Erro ao reiniciar serviço: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/logs", response_model=List[LogEntry])
async def get_logs(
    log_config: SystemLogs = Depends(),
    service: SystemService = Depends(get_system_service)
):
    """Obter logs do sistema"""
    try:
        return await service.get_logs(log_config)
    except Exception as e:
        logger.error(f"Erro ao obter logs: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/info", response_model=Dict[str, Any])
async def get_system_info(service: SystemService = Depends(get_system_service)):
    """Obter informações básicas do sistema"""
    try:
        from utils.system import SystemUtils
        system_utils = SystemUtils()
        return system_utils.get_system_info()
    except Exception as e:
        logger.error(f"Erro ao obter informações do sistema: {e}")
        raise HTTPException(status_code=500, detail=str(e))