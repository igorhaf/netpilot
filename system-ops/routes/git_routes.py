#!/usr/bin/env python3
"""
Git Operations Routes
Rotas para operações Git no host
"""

import logging
import subprocess
import os
from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/git", tags=["Git Operations"])


class GitCloneRequest(BaseModel):
    repository: str
    targetPath: str
    username: str
    branch: Optional[str] = None


class GitCommandResponse(BaseModel):
    success: bool
    stdout: str
    stderr: str
    message: str


@router.post("/clone", response_model=GitCommandResponse)
async def clone_repository(request: GitCloneRequest):
    """
    Clona um repositório Git no host
    """
    try:
        logger.info(f"🔄 Clonando repositório: {request.repository}")
        logger.info(f"   Destino: {request.targetPath}")
        logger.info(f"   Usuário: {request.username}")

        # Validar que o diretório pai existe
        parent_dir = os.path.dirname(request.targetPath)
        if not os.path.exists(parent_dir):
            raise HTTPException(
                status_code=400,
                detail=f"Diretório pai não existe: {parent_dir}"
            )

        # Verificar se o diretório de destino já existe e está vazio
        if os.path.exists(request.targetPath):
            if os.listdir(request.targetPath):
                # Diretório existe e não está vazio, clonar dentro dele
                clone_cmd = [
                    'sudo', '-u', request.username,
                    'git', 'clone',
                    request.repository,
                    '.'
                ]
                cwd = request.targetPath
            else:
                # Diretório vazio, clonar dentro dele
                clone_cmd = [
                    'sudo', '-u', request.username,
                    'git', 'clone',
                    request.repository,
                    '.'
                ]
                cwd = request.targetPath
        else:
            # Diretório não existe, git clone vai criar
            clone_cmd = [
                'sudo', '-u', request.username,
                'git', 'clone',
                request.repository,
                request.targetPath
            ]
            cwd = parent_dir

        # Adicionar branch se especificado
        if request.branch:
            clone_cmd.extend(['-b', request.branch])

        logger.info(f"   Comando: {' '.join(clone_cmd)}")
        logger.info(f"   Working dir: {cwd}")

        # Executar comando git clone
        process = subprocess.run(
            clone_cmd,
            cwd=cwd,
            capture_output=True,
            text=True,
            timeout=300  # 5 minutos timeout
        )

        stdout = process.stdout
        stderr = process.stderr

        if process.returncode != 0:
            error_msg = stderr or stdout or "Erro desconhecido ao clonar repositório"
            logger.error(f"❌ Erro ao clonar: {error_msg}")
            raise HTTPException(
                status_code=500,
                detail=f"Falha ao clonar repositório: {error_msg}"
            )

        # Garantir permissões corretas
        try:
            subprocess.run(
                ['sudo', 'chown', '-R', f'{request.username}:{request.username}', request.targetPath],
                check=True,
                capture_output=True,
                text=True,
                timeout=30
            )
            logger.info(f"✅ Permissões ajustadas para {request.username}")
        except subprocess.CalledProcessError as e:
            logger.warning(f"⚠️ Erro ao ajustar permissões: {e.stderr}")

        logger.info(f"✅ Repositório clonado com sucesso em: {request.targetPath}")

        return GitCommandResponse(
            success=True,
            stdout=stdout,
            stderr=stderr,
            message=f"Repositório clonado com sucesso em {request.targetPath}"
        )

    except subprocess.TimeoutExpired:
        logger.error("❌ Timeout ao clonar repositório")
        raise HTTPException(
            status_code=408,
            detail="Timeout ao clonar repositório (limite de 5 minutos)"
        )
    except Exception as e:
        logger.error(f"❌ Erro ao clonar repositório: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao clonar repositório: {str(e)}"
        )


@router.post("/pull", response_model=GitCommandResponse)
async def git_pull(targetPath: str, username: str):
    """
    Executa git pull em um repositório
    """
    try:
        logger.info(f"🔄 Executando git pull em: {targetPath}")

        if not os.path.exists(targetPath):
            raise HTTPException(
                status_code=404,
                detail=f"Diretório não encontrado: {targetPath}"
            )

        # Executar git pull
        process = subprocess.run(
            ['sudo', '-u', username, 'git', '-C', targetPath, 'pull'],
            capture_output=True,
            text=True,
            timeout=120
        )

        stdout = process.stdout
        stderr = process.stderr

        if process.returncode != 0:
            error_msg = stderr or stdout or "Erro desconhecido ao fazer pull"
            logger.error(f"❌ Erro no git pull: {error_msg}")
            raise HTTPException(
                status_code=500,
                detail=f"Falha ao fazer pull: {error_msg}"
            )

        logger.info(f"✅ Git pull executado com sucesso")

        return GitCommandResponse(
            success=True,
            stdout=stdout,
            stderr=stderr,
            message="Git pull executado com sucesso"
        )

    except subprocess.TimeoutExpired:
        logger.error("❌ Timeout no git pull")
        raise HTTPException(
            status_code=408,
            detail="Timeout ao fazer pull (limite de 2 minutos)"
        )
    except Exception as e:
        logger.error(f"❌ Erro no git pull: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Erro no git pull: {str(e)}"
        )
