"""
NetPilot System Operations - User Routes
Endpoints para gerenciamento de usuários e sessões
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any
import logging

from models.users import (
    SystemUser, TerminalSession, CommandExecution, SessionList,
    CommandResult, UserSession
)
from services.user_service import UserService

logger = logging.getLogger(__name__)

router = APIRouter()

# Dependency para obter instância do serviço
def get_user_service() -> UserService:
    return UserService()

@router.post("/create-system-user", response_model=Dict[str, Any])
async def create_system_user(
    user_config: SystemUser,
    service: UserService = Depends(get_user_service)
):
    """Criar usuário do sistema"""
    try:
        return await service.create_system_user(user_config)
    except Exception as e:
        logger.error(f"Erro ao criar usuário: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/create-terminal-session", response_model=Dict[str, Any])
async def create_terminal_session(
    session_config: TerminalSession,
    service: UserService = Depends(get_user_service)
):
    """Criar sessão terminal"""
    try:
        return await service.create_terminal_session(session_config)
    except Exception as e:
        logger.error(f"Erro ao criar sessão terminal: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/execute-command", response_model=CommandResult)
async def execute_command(
    command_config: CommandExecution,
    service: UserService = Depends(get_user_service)
):
    """Executar comando em uma sessão"""
    try:
        return await service.execute_command(command_config)
    except Exception as e:
        logger.error(f"Erro ao executar comando: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/list-sessions", response_model=SessionList)
async def list_sessions(service: UserService = Depends(get_user_service)):
    """Listar sessões ativas"""
    try:
        return await service.list_sessions()
    except Exception as e:
        logger.error(f"Erro ao listar sessões: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/close-session/{session_id}", response_model=Dict[str, Any])
async def close_session(
    session_id: str,
    service: UserService = Depends(get_user_service)
):
    """Fechar sessão terminal"""
    try:
        return await service.close_session(session_id)
    except Exception as e:
        logger.error(f"Erro ao fechar sessão: {e}")
        raise HTTPException(status_code=500, detail=str(e))