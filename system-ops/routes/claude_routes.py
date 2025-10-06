"""
Claude Code AI Execution Routes
Endpoints para executar comandos Claude Code com agentes bender/marvin
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
import subprocess
import random
import time
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/claude", tags=["Claude Code AI"])

class ClaudeExecuteRequest(BaseModel):
    projectPath: str = Field(..., description="Caminho do projeto (/home/{project}/code)")
    prompt: str = Field(..., description="Prompt para o Claude Code")
    agent: Optional[str] = Field(None, description="Agente específico (bender/marvin) ou aleatório se None")
    timeoutSeconds: int = Field(default=300, description="Timeout em segundos")

class ClaudeExecuteResponse(BaseModel):
    success: bool
    stdout: str
    stderr: str
    agent: str
    returncode: int
    executionTimeMs: int

@router.post("/execute", response_model=ClaudeExecuteResponse)
async def execute_claude(request: ClaudeExecuteRequest) -> ClaudeExecuteResponse:
    """
    Executa comando Claude Code usando agentes bender/marvin no HOST

    - **projectPath**: Diretório do projeto onde executar o comando
    - **prompt**: Prompt para o Claude Code processar
    - **agent**: Agente específico ou aleatório (bender/marvin)
    - **timeoutSeconds**: Tempo máximo de execução
    """
    start_time = time.time()

    try:
        # Selecionar agente aleatoriamente se não especificado
        agent = request.agent
        if not agent or agent not in ['bender', 'marvin']:
            agent = random.choice(['bender', 'marvin'])

        logger.info(f"🤖 Executando Claude Code com agente {agent}")
        logger.info(f"📁 Projeto: {request.projectPath}")
        logger.info(f"💬 Prompt: {request.prompt[:100]}...")

        # Escapar prompt para shell
        escaped_prompt = request.prompt.replace("'", "'\"'\"'")

        # Adicionar contexto do diretório de trabalho ao prompt
        enhanced_prompt = f"Working directory is {request.projectPath}. When creating files or projects, always use relative paths or the current directory. {escaped_prompt}"
        escaped_enhanced_prompt = enhanced_prompt.replace("'", "'\"'\"'")

        # Comando para executar Claude Code como usuário específico
        # cd: muda para o diretório do projeto antes de executar
        # --continue: continua a conversa anterior
        # --print: modo não-interativo, imprime resposta e sai
        # --permission-mode bypassPermissions: pula todas as verificações de permissão
        command = [
            'su', '-s', '/bin/bash', agent, '-c',
            f'cd "{request.projectPath}" && claude --continue --print --permission-mode bypassPermissions "{escaped_enhanced_prompt}"'
        ]

        # Executar comando
        process = subprocess.run(
            command,
            capture_output=True,
            text=True,
            timeout=request.timeoutSeconds
        )

        execution_time_ms = int((time.time() - start_time) * 1000)

        logger.info(f"✅ Claude Code concluído: agent={agent}, returncode={process.returncode}, time={execution_time_ms}ms")
        logger.info(f"📤 STDOUT: {process.stdout[:500]}")
        logger.info(f"📤 STDERR: {process.stderr[:500]}")

        return ClaudeExecuteResponse(
            success=process.returncode == 0,
            stdout=process.stdout,
            stderr=process.stderr,
            agent=agent,
            returncode=process.returncode,
            executionTimeMs=execution_time_ms
        )

    except subprocess.TimeoutExpired:
        execution_time_ms = int((time.time() - start_time) * 1000)
        logger.error(f"❌ Claude Code timeout após {request.timeoutSeconds}s")

        raise HTTPException(
            status_code=408,
            detail=f"Execução excedeu o tempo limite de {request.timeoutSeconds} segundos"
        )

    except Exception as e:
        execution_time_ms = int((time.time() - start_time) * 1000)
        logger.error(f"❌ Erro ao executar Claude Code: {str(e)}")

        raise HTTPException(
            status_code=500,
            detail=f"Erro ao executar Claude Code: {str(e)}"
        )

@router.get("/agents")
async def list_agents():
    """
    Lista agentes Claude Code disponíveis
    """
    return {
        "agents": [
            {
                "name": "bender",
                "description": "Agente mestre - armazena histórico compartilhado",
                "role": "master"
            },
            {
                "name": "marvin",
                "description": "Agente slave - usa symlinks para histórico compartilhado",
                "role": "slave"
            }
        ],
        "loadBalancing": "random 50/50 entre bender e marvin"
    }

@router.get("/health")
async def claude_health():
    """
    Verifica status dos agentes Claude Code
    """
    try:
        # Verificar se Claude CLI está instalado
        result = subprocess.run(
            ['claude', '--version'],
            capture_output=True,
            text=True,
            timeout=5
        )

        version = result.stdout.strip() if result.returncode == 0 else "não instalado"

        # Verificar usuários bender e marvin
        bender_exists = subprocess.run(['id', 'bender'], capture_output=True).returncode == 0
        marvin_exists = subprocess.run(['id', 'marvin'], capture_output=True).returncode == 0

        return {
            "status": "healthy" if result.returncode == 0 else "unhealthy",
            "claudeVersion": version,
            "agents": {
                "bender": "available" if bender_exists else "missing",
                "marvin": "available" if marvin_exists else "missing"
            }
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e)
        }
