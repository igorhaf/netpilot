"""
Configuration Routes
Endpoints para geração de configurações Nginx e Traefik
"""
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
import logging
from typing import Dict, Any

from database.connection import get_db
from services.config_generation_service import ConfigGenerationService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/config", tags=["Configuration"])


@router.post("/generate-nginx", response_model=Dict[str, Any])
async def generate_nginx(db: Session = Depends(get_db)):
    """
    Gera configurações Nginx para todos os domínios ativos
    """
    try:
        logger.info("📝 Solicitação para gerar configurações Nginx")

        service = ConfigGenerationService()
        result = service.generate_nginx_config(db)

        return result

    except Exception as e:
        logger.error(f"❌ Erro ao gerar configurações Nginx: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-traefik", response_model=Dict[str, Any])
async def generate_traefik(db: Session = Depends(get_db)):
    """
    Gera configuração dinâmica do Traefik
    """
    try:
        logger.info("📝 Solicitação para gerar configuração Traefik")

        service = ConfigGenerationService()
        result = service.generate_traefik_config(db)

        return result

    except Exception as e:
        logger.error(f"❌ Erro ao gerar configuração Traefik: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-all", response_model=Dict[str, Any])
async def generate_all(db: Session = Depends(get_db)):
    """
    Gera todas as configurações (Nginx + Traefik)
    """
    try:
        logger.info("📝 Solicitação para gerar todas as configurações")

        service = ConfigGenerationService()
        result = service.generate_all_configs(db)

        return result

    except Exception as e:
        logger.error(f"❌ Erro ao gerar configurações: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/reload-nginx", response_model=Dict[str, Any])
async def reload_nginx():
    """
    Recarrega Nginx após alterações de configuração
    """
    try:
        logger.info("🔄 Solicitação para recarregar Nginx")

        service = ConfigGenerationService()
        result = await service.reload_nginx()

        return result

    except Exception as e:
        logger.error(f"❌ Erro ao recarregar Nginx: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/regenerate-and-reload", response_model=Dict[str, Any])
async def regenerate_and_reload(db: Session = Depends(get_db)):
    """
    Gera todas as configurações e recarrega Nginx (operação completa)
    """
    try:
        logger.info("🔧 Regenerando configurações e recarregando Nginx")

        service = ConfigGenerationService()

        # Gerar configurações
        gen_result = service.generate_all_configs(db)

        # Recarregar Nginx
        reload_result = await service.reload_nginx()

        return {
            "success": gen_result["success"] and reload_result["success"],
            "message": "Configurações geradas e Nginx recarregado",
            "generation": gen_result,
            "reload": reload_result
        }

    except Exception as e:
        logger.error(f"❌ Erro na operação completa: {e}")
        raise HTTPException(status_code=500, detail=str(e))
