"""
NetPilot System Operations - System Routes
Endpoints para operações gerais do sistema
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any
from pydantic import BaseModel, Field
import logging
import subprocess

from models.system import (
    SystemHealth, SystemResources, ServiceStatus, ServiceRestart,
    SystemLogs, LogEntry, OperationResponse
)
from services.system_service import SystemService

class SimpleCommandRequest(BaseModel):
    command: str = Field(..., description="Comando a executar")
    workingDirectory: str = Field(..., description="Diretório de trabalho")
    timeout: int = Field(default=300, description="Timeout em segundos")

class SimpleCommandResponse(BaseModel):
    success: bool
    stdout: str
    stderr: str
    returncode: int
    executionTimeMs: int

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

@router.post("/execute-command", response_model=SimpleCommandResponse)
async def execute_simple_command(request: SimpleCommandRequest):
    """Executar comando simples no sistema"""
    import time
    start_time = time.time()

    try:
        logger.info(f"🔧 Executando comando: {request.command}")
        logger.info(f"📁 Diretório: {request.workingDirectory}")

        process = subprocess.run(
            request.command,
            shell=True,
            cwd=request.workingDirectory,
            capture_output=True,
            text=True,
            timeout=request.timeout
        )

        execution_time_ms = int((time.time() - start_time) * 1000)

        logger.info(f"✅ Comando concluído: returncode={process.returncode}, time={execution_time_ms}ms")

        return SimpleCommandResponse(
            success=process.returncode == 0,
            stdout=process.stdout,
            stderr=process.stderr,
            returncode=process.returncode,
            executionTimeMs=execution_time_ms
        )

    except subprocess.TimeoutExpired:
        execution_time_ms = int((time.time() - start_time) * 1000)
        logger.error(f"❌ Comando timeout após {request.timeout}s")

        raise HTTPException(
            status_code=408,
            detail=f"Comando excedeu o tempo limite de {request.timeout} segundos"
        )

    except Exception as e:
        execution_time_ms = int((time.time() - start_time) * 1000)
        logger.error(f"❌ Erro ao executar comando: {str(e)}")

        raise HTTPException(
            status_code=500,
            detail=f"Erro ao executar comando: {str(e)}"
        )

@router.post("/execute-command-stream")
async def execute_command_stream(request: SimpleCommandRequest):
    """Executar comando com streaming de output em tempo real"""
    import asyncio
    from fastapi.responses import StreamingResponse

    async def stream_output():
        try:
            logger.info(f"🔧 Executando comando (stream): {request.command}")
            logger.info(f"📁 Diretório: {request.workingDirectory}")

            # Executar comando com Popen para capturar output em tempo real
            process = subprocess.Popen(
                request.command,
                shell=True,
                cwd=request.workingDirectory,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                bufsize=1
            )

            # Ler output linha por linha e enviar
            while True:
                line = process.stdout.readline()
                if not line and process.poll() is not None:
                    break
                if line:
                    yield line
                    await asyncio.sleep(0.01)  # Small delay to prevent flooding

            # Obter código de saída
            returncode = process.poll()
            logger.info(f"✅ Comando concluído: returncode={returncode}")

        except Exception as e:
            logger.error(f"❌ Erro no streaming: {str(e)}")
            yield f"\n[ERRO: {str(e)}]\n"

    return StreamingResponse(stream_output(), media_type="text/plain")