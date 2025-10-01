from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional
import asyncio
import subprocess
import os
import time
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/jobs", tags=["Jobs"])

class JobExecuteRequest(BaseModel):
    scriptPath: str = Field(..., description="Caminho para o script a ser executado")
    scriptType: str = Field(..., description="Tipo do script (shell, python, node)")
    environmentVars: Dict[str, str] = Field(default_factory=dict, description="Variáveis de ambiente")
    timeoutSeconds: int = Field(default=300, description="Timeout em segundos")
    jobId: str = Field(..., description="ID do job")
    executionId: str = Field(..., description="ID da execução")

class JobExecuteResponse(BaseModel):
    success: bool
    output: Optional[str] = None
    error: Optional[str] = None
    executionTimeMs: int
    exitCode: Optional[int] = None
    jobId: str
    executionId: str

@router.post("/execute", response_model=JobExecuteResponse)
async def execute_job(request: JobExecuteRequest) -> JobExecuteResponse:
    """
    Executa um script do sistema operacional
    """
    start_time = time.time()

    try:
        logger.info(f"🚀 Executando job {request.jobId}: {request.scriptPath}")

        # Validar tipo de script
        if request.scriptType not in ['shell', 'python', 'node']:
            raise HTTPException(
                status_code=400,
                detail=f"Tipo de script não suportado: {request.scriptType}"
            )

        # Verificar se arquivo existe
        if not os.path.exists(request.scriptPath):
            raise HTTPException(
                status_code=404,
                detail=f"Script não encontrado: {request.scriptPath}"
            )

        # Verificar se arquivo é executável
        if not os.access(request.scriptPath, os.R_OK):
            raise HTTPException(
                status_code=403,
                detail=f"Script não é legível: {request.scriptPath}"
            )

        # Determinar comando baseado no tipo
        command = []
        if request.scriptType == 'shell':
            command = ['bash', request.scriptPath]
        elif request.scriptType == 'python':
            command = ['python3', request.scriptPath]
        elif request.scriptType == 'node':
            command = ['node', request.scriptPath]

        # Preparar ambiente
        env = os.environ.copy()
        env.update(request.environmentVars)

        # Executar processo
        process = await asyncio.create_subprocess_exec(
            *command,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            env=env,
            cwd=os.path.dirname(request.scriptPath) if os.path.dirname(request.scriptPath) else '.'
        )

        # Aguardar conclusão com timeout
        try:
            stdout, stderr = await asyncio.wait_for(
                process.communicate(),
                timeout=request.timeoutSeconds
            )
        except asyncio.TimeoutError:
            process.kill()
            await process.wait()
            raise HTTPException(
                status_code=408,
                detail=f"Execução excedeu o tempo limite de {request.timeoutSeconds} segundos"
            )

        execution_time_ms = int((time.time() - start_time) * 1000)

        # Decodificar output
        output_str = stdout.decode('utf-8') if stdout else ''
        error_str = stderr.decode('utf-8') if stderr else ''

        success = process.returncode == 0

        logger.info(f"✅ Job {request.jobId} concluído: exit_code={process.returncode}, time={execution_time_ms}ms")

        return JobExecuteResponse(
            success=success,
            output=output_str,
            error=error_str if error_str else None,
            executionTimeMs=execution_time_ms,
            exitCode=process.returncode,
            jobId=request.jobId,
            executionId=request.executionId
        )

    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        execution_time_ms = int((time.time() - start_time) * 1000)
        logger.error(f"❌ Erro ao executar job {request.jobId}: {str(e)}")

        raise HTTPException(
            status_code=500,
            detail=f"Erro interno ao executar script: {str(e)}"
        )

@router.get("/status/{job_id}")
async def get_job_status(job_id: str):
    """
    Obtém status de um job (placeholder para futuro)
    """
    return {
        "job_id": job_id,
        "status": "completed",
        "message": "Job status endpoint - implementação futura"
    }

@router.get("/list")
async def list_jobs():
    """
    Lista jobs ativos (placeholder para futuro)
    """
    return {
        "jobs": [],
        "message": "Job listing endpoint - implementação futura"
    }