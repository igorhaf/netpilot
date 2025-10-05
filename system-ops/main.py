#!/usr/bin/env python3
"""
NetPilot System Operations - FastAPI Microservice
Sistema de operações de sistema para o NetPilot
"""

import logging
import os
import sys
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv

# Carrega variáveis de ambiente
load_dotenv()

# Configuração de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/var/log/netpilot-system-ops.log'),
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gerenciamento do ciclo de vida da aplicação"""
    logger.info("🚀 NetPilot System Operations iniciando...")

    # Verificações de inicialização
    try:
        from utils.system import SystemUtils
        from utils.security import SecurityValidator
        from services.ssh_service import ssh_service
        from services.docker_service import docker_service
        from services.websocket_service import connection_manager
        from services.monitoring_service import monitoring_service
        from database.connection import init_db

        # Inicializar banco de dados
        init_db()

        # Verificar permissões e dependências
        system_utils = SystemUtils()
        security = SecurityValidator()

        # Inicializar serviços
        await ssh_service.start_service()
        await docker_service.start_service()
        await monitoring_service.start_service()

        logger.info("✅ Banco de dados PostgreSQL conectado")
        logger.info("✅ Sistema de segurança inicializado")
        logger.info("✅ Utilitários de sistema carregados")
        logger.info("✅ Serviço SSH inicializado")
        logger.info("✅ Serviço Docker inicializado")
        logger.info("✅ Serviço WebSocket inicializado")
        logger.info("✅ Serviço de Monitoramento inicializado")

    except Exception as e:
        logger.error(f"❌ Erro na inicialização: {e}")
        raise

    yield

    logger.info("🛑 NetPilot System Operations encerrando...")

    # Finalizar serviços
    try:
        await ssh_service.stop_service()
        await docker_service.stop_service()
        await monitoring_service.stop_service()
        await connection_manager.cleanup()
        logger.info("✅ Serviço SSH finalizado")
        logger.info("✅ Serviço Docker finalizado")
        logger.info("✅ Serviço de Monitoramento finalizado")
        logger.info("✅ Serviço WebSocket finalizado")
    except Exception as e:
        logger.error(f"❌ Erro ao finalizar serviços: {e}")

# Configuração da aplicação FastAPI
app = FastAPI(
    title="NetPilot System Operations",
    description="Microserviço Python para operações de sistema do NetPilot",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Configuração CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Importar e registrar rotas
from routes.nginx_routes import router as nginx_router
from routes.ssl_routes import router as ssl_router
from routes.user_routes import router as user_router
from routes.traffic_routes import router as traffic_router
from routes.system_routes import router as system_router
from routes.jobs import router as jobs_router
from routes.ssh import router as ssh_router
from routes.docker_routes import router as docker_router
from routes.websocket_routes import router as websocket_router
from routes.monitoring_routes import router as monitoring_router
from routes.config_routes import router as config_router
from routes.claude_routes import router as claude_router

app.include_router(nginx_router, prefix="/nginx", tags=["Nginx Operations"])
app.include_router(ssl_router, prefix="/ssl", tags=["SSL Operations"])
app.include_router(user_router, prefix="/users", tags=["User Management"])
app.include_router(traffic_router, prefix="/traffic", tags=["Traffic Management"])
app.include_router(system_router, prefix="/system", tags=["System Operations"])
app.include_router(jobs_router, tags=["Job Execution"])
app.include_router(ssh_router, tags=["SSH Operations"])
app.include_router(docker_router, prefix="/docker", tags=["Docker Operations"])
app.include_router(websocket_router, prefix="/ws", tags=["WebSocket Streaming"])
app.include_router(monitoring_router, prefix="/monitoring", tags=["Advanced Monitoring"])
app.include_router(config_router, tags=["Configuration Generation"])
app.include_router(claude_router, tags=["Claude Code AI"])

@app.get("/", response_model=dict)
async def root():
    """Endpoint raiz com informações do serviço"""
    return {
        "service": "NetPilot System Operations",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
        "health": "/system/health"
    }

@app.get("/health", response_model=dict)
async def health_check():
    """Health check básico"""
    return {
        "status": "healthy",
        "service": "netpilot-system-ops",
        "timestamp": str(os.popen('date').read().strip())
    }

# Handler global de exceções
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Handler global para exceções não tratadas"""
    logger.error(f"Erro não tratado: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "message": str(exc) if os.getenv("DEBUG", "false").lower() == "true" else "Erro interno do servidor"
        }
    )

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8001))
    debug = os.getenv("DEBUG", "false").lower() == "true"

    logger.info(f"🌐 Iniciando servidor na porta {port}")

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=debug,
        log_level="info" if debug else "warning"
    )