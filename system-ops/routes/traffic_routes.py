"""
NetPilot System Operations - Traffic Routes
Endpoints para gerenciamento de tráfego e firewall
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any
import logging

from models.system import TrafficRule, TrafficStats
from services.traffic_service import TrafficService

logger = logging.getLogger(__name__)

router = APIRouter()

# Dependency para obter instância do serviço
def get_traffic_service() -> TrafficService:
    return TrafficService()

@router.post("/setup-rules", response_model=Dict[str, Any])
async def setup_traffic_rules(
    rules: List[TrafficRule],
    service: TrafficService = Depends(get_traffic_service)
):
    """Configurar regras de tráfego"""
    try:
        return await service.setup_traffic_rules(rules)
    except Exception as e:
        logger.error(f"Erro ao configurar regras de tráfego: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/block-ip", response_model=Dict[str, Any])
async def block_ip(
    ip_address: str,
    duration_minutes: int = None,
    reason: str = "Manual block",
    service: TrafficService = Depends(get_traffic_service)
):
    """Bloquear endereço IP"""
    try:
        return await service.block_ip(ip_address, duration_minutes, reason)
    except Exception as e:
        logger.error(f"Erro ao bloquear IP: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/rate-limit", response_model=Dict[str, Any])
async def setup_rate_limiting(
    ip_address: str,
    requests_per_minute: int,
    duration_minutes: int = None,
    service: TrafficService = Depends(get_traffic_service)
):
    """Configurar rate limiting para IP"""
    try:
        return await service.setup_rate_limiting(
            ip_address, requests_per_minute, duration_minutes
        )
    except Exception as e:
        logger.error(f"Erro ao configurar rate limiting: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stats", response_model=TrafficStats)
async def get_traffic_stats(service: TrafficService = Depends(get_traffic_service)):
    """Obter estatísticas de tráfego"""
    try:
        return await service.get_traffic_stats()
    except Exception as e:
        logger.error(f"Erro ao obter estatísticas de tráfego: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/rules", response_model=List[TrafficRule])
async def list_active_rules(service: TrafficService = Depends(get_traffic_service)):
    """Listar regras de tráfego ativas"""
    try:
        return await service.list_active_rules()
    except Exception as e:
        logger.error(f"Erro ao listar regras ativas: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/rules/{rule_id}", response_model=Dict[str, Any])
async def remove_rule(
    rule_id: str,
    service: TrafficService = Depends(get_traffic_service)
):
    """Remover regra de tráfego"""
    try:
        return await service.remove_rule(rule_id)
    except Exception as e:
        logger.error(f"Erro ao remover regra: {e}")
        raise HTTPException(status_code=500, detail=str(e))