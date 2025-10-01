from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import logging

from models.ssh import (
    SSHConnectionRequest, SSHConnectionResponse,
    SSHCommandRequest, SSHCommandResponse,
    SSHDisconnectRequest, SSHDisconnectResponse,
    SSHListSessionsResponse, SSHHealthResponse
)
from services.ssh_service import ssh_service

logger = logging.getLogger(__name__)
security = HTTPBearer()

router = APIRouter(prefix="/ssh", tags=["SSH Operations"])

async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verifica token de autenticação"""
    # Em produção, implementar validação real do token
    expected_token = "netpilot-internal-token"
    if credentials.credentials != expected_token:
        raise HTTPException(status_code=401, detail="Token inválido")
    return credentials.credentials

@router.post("/connect", response_model=SSHConnectionResponse)
async def connect_ssh_session(
    request: SSHConnectionRequest,
    token: str = Depends(verify_token)
) -> SSHConnectionResponse:
    """
    Estabelece uma nova conexão SSH
    """
    try:
        logger.info(f"🔐 Nova conexão SSH: {request.username}@{request.hostname}")

        response = await ssh_service.connect_session(request)

        if not response.success:
            raise HTTPException(status_code=400, detail=response.message)

        return response

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Erro ao conectar SSH: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")

@router.post("/execute", response_model=SSHCommandResponse)
async def execute_ssh_command(
    request: SSHCommandRequest,
    token: str = Depends(verify_token)
) -> SSHCommandResponse:
    """
    Executa um comando via SSH
    """
    try:
        logger.info(f"⚡ Comando SSH: {request.command} (session: {request.sessionId})")

        response = await ssh_service.execute_command(request)

        # Não levantar exceção se comando falhou (exit_code != 0)
        # Isso é comportamento normal, retornar o resultado
        return response

    except Exception as e:
        logger.error(f"❌ Erro ao executar comando SSH: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")

@router.post("/disconnect", response_model=SSHDisconnectResponse)
async def disconnect_ssh_session(
    request: SSHDisconnectRequest,
    token: str = Depends(verify_token)
) -> SSHDisconnectResponse:
    """
    Desconecta uma sessão SSH
    """
    try:
        logger.info(f"🔌 Desconectando SSH: {request.sessionId}")

        response = await ssh_service.disconnect_session(request)

        return response

    except Exception as e:
        logger.error(f"❌ Erro ao desconectar SSH: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")

@router.get("/sessions", response_model=SSHListSessionsResponse)
async def list_ssh_sessions(token: str = Depends(verify_token)) -> SSHListSessionsResponse:
    """
    Lista todas as sessões SSH ativas
    """
    try:
        response = await ssh_service.list_sessions()
        return response

    except Exception as e:
        logger.error(f"❌ Erro ao listar sessões SSH: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")

@router.delete("/sessions/{session_id}")
async def force_disconnect_session(
    session_id: str,
    token: str = Depends(verify_token)
):
    """
    Força a desconexão de uma sessão SSH específica
    """
    try:
        request = SSHDisconnectRequest(sessionId=session_id, userId="system")
        response = await ssh_service.disconnect_session(request)

        return {
            "success": response.success,
            "message": response.message,
            "sessionId": session_id
        }

    except Exception as e:
        logger.error(f"❌ Erro ao forçar desconexão SSH: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")

@router.get("/health", response_model=SSHHealthResponse)
async def get_ssh_health() -> SSHHealthResponse:
    """
    Obtém status de saúde do serviço SSH
    """
    try:
        response = await ssh_service.get_service_health()
        return response

    except Exception as e:
        logger.error(f"❌ Erro ao obter saúde SSH: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")

@router.get("/test-connection")
async def test_ssh_connectivity(
    hostname: str,
    port: int = 22,
    username: str = "root",
    timeout: int = 10,
    token: str = Depends(verify_token)
):
    """
    Testa conectividade SSH básica (sem autenticação completa)
    """
    import socket

    try:
        logger.info(f"🧪 Testando conectividade SSH: {hostname}:{port}")

        # Teste básico de conectividade TCP
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(timeout)

        try:
            result = sock.connect_ex((hostname, port))
            if result == 0:
                connectivity_status = "reachable"
                message = f"Porta {port} está acessível em {hostname}"
            else:
                connectivity_status = "unreachable"
                message = f"Porta {port} não está acessível em {hostname}"
        finally:
            sock.close()

        # Teste básico de protocolo SSH
        ssh_protocol_ok = False
        try:
            import paramiko
            transport = paramiko.Transport((hostname, port))
            transport.start_client(timeout=timeout)
            ssh_protocol_ok = True
            transport.close()
        except Exception as e:
            logger.warning(f"Protocolo SSH não disponível: {e}")

        return {
            "hostname": hostname,
            "port": port,
            "connectivity": connectivity_status,
            "ssh_protocol_available": ssh_protocol_ok,
            "message": message,
            "tested_at": str(logger.__class__.__module__)
        }

    except Exception as e:
        logger.error(f"❌ Erro no teste de conectividade: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro no teste: {str(e)}")

# Endpoints de compatibilidade com NestJS (mesmos nomes)
@router.post("/create-terminal-session", response_model=SSHConnectionResponse)
async def create_terminal_session_compat(
    request: SSHConnectionRequest,
    token: str = Depends(verify_token)
) -> SSHConnectionResponse:
    """
    Endpoint de compatibilidade para criar sessão terminal
    """
    return await connect_ssh_session(request, token)

@router.post("/execute-command", response_model=SSHCommandResponse)
async def execute_command_compat(
    request: SSHCommandRequest,
    token: str = Depends(verify_token)
) -> SSHCommandResponse:
    """
    Endpoint de compatibilidade para executar comando
    """
    return await execute_ssh_command(request, token)

@router.get("/list-sessions", response_model=SSHListSessionsResponse)
async def list_sessions_compat(token: str = Depends(verify_token)) -> SSHListSessionsResponse:
    """
    Endpoint de compatibilidade para listar sessões
    """
    return await list_ssh_sessions(token)

@router.delete("/close-session/{session_id}")
async def close_session_compat(
    session_id: str,
    token: str = Depends(verify_token)
):
    """
    Endpoint de compatibilidade para fechar sessão
    """
    return await force_disconnect_session(session_id, token)