"""
Docker Management Routes
Endpoints para gerenciamento de Docker no NetPilot
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks, Query
from typing import List, Optional
import logging

from models.docker import (
    # Container models
    ContainerInfo,
    ContainerInspectInfo,
    CreateContainerRequest,
    ContainerActionRequest,
    ContainerListRequest,
    ContainerExecRequest,
    ContainerExecResponse,
    ContainerStats,
    LogEntry,
    LogsRequest,

    # Image models
    ImageInfo,
    ImageListRequest,
    ImagePullRequest,
    ImageRemoveRequest,

    # Volume models
    VolumeInfo,
    CreateVolumeRequest,
    VolumeListRequest,

    # Network models
    NetworkInfo,
    CreateNetworkRequest,
    NetworkConnectRequest,
    NetworkDisconnectRequest,

    # Response models
    DockerOperationResponse,
    DockerHealthResponse,
    DockerSystemInfo
)
from services.docker_service import docker_service
from utils.callbacks import callback_manager

logger = logging.getLogger(__name__)
router = APIRouter()

# ===========================
# CONTAINER ENDPOINTS
# ===========================

@router.get("/containers", response_model=List[ContainerInfo])
async def list_containers(
    all: bool = Query(default=True, description="Incluir containers parados"),
    status: Optional[str] = Query(default=None, description="Filtrar por status"),
    image: Optional[str] = Query(default=None, description="Filtrar por imagem"),
    name: Optional[str] = Query(default=None, description="Filtrar por nome"),
    label: Optional[str] = Query(default=None, description="Filtrar por label")
):
    """Lista containers Docker"""
    try:
        request = ContainerListRequest(
            all=all,
            status=status,
            image=image,
            name=name,
            label=label
        )
        containers = await docker_service.list_containers(request)
        return containers
    except Exception as e:
        logger.error(f"Erro ao listar containers: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/containers", response_model=DockerOperationResponse)
async def create_container(
    container_request: CreateContainerRequest,
    background_tasks: BackgroundTasks
):
    """Cria um novo container Docker"""
    try:
        logger.info(f"Criando container: {container_request.name}")
        result = await docker_service.create_container(container_request)

        # Enviar callback assíncrono
        background_tasks.add_task(
            callback_manager.send_callback,
            "/docker/container/created",
            {
                "operation": "container_create",
                "container_name": container_request.name,
                "image": container_request.image,
                "result": result
            }
        )

        return result
    except Exception as e:
        logger.error(f"Erro ao criar container: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/containers/{container_id}", response_model=ContainerInspectInfo)
async def inspect_container(container_id: str):
    """Obtém informações detalhadas de um container"""
    try:
        container_info = await docker_service.inspect_container(container_id)
        return container_info
    except Exception as e:
        logger.error(f"Erro ao inspecionar container {container_id}: {e}")
        raise HTTPException(status_code=404, detail=f"Container não encontrado: {container_id}")

@router.post("/containers/{container_id}/action", response_model=DockerOperationResponse)
async def container_action(
    container_id: str,
    action_request: ContainerActionRequest,
    background_tasks: BackgroundTasks
):
    """Executa ação em container (start, stop, restart, etc.)"""
    try:
        logger.info(f"Executando ação {action_request.action} no container {container_id}")
        result = await docker_service.container_action(container_id, action_request)

        # Enviar callback assíncrono
        background_tasks.add_task(
            callback_manager.send_callback,
            "/docker/container/action",
            {
                "operation": f"container_{action_request.action}",
                "container_id": container_id,
                "action": action_request.action,
                "result": result
            }
        )

        return result
    except Exception as e:
        logger.error(f"Erro ao executar ação {action_request.action} no container {container_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/containers/{container_id}", response_model=DockerOperationResponse)
async def remove_container(
    container_id: str,
    background_tasks: BackgroundTasks,
    force: bool = Query(default=False, description="Forçar remoção")
):
    """Remove um container"""
    try:
        logger.info(f"Removendo container {container_id}")
        result = await docker_service.remove_container(container_id, force)

        # Enviar callback assíncrono
        background_tasks.add_task(
            callback_manager.send_callback,
            "/docker/container/removed",
            {
                "operation": "container_remove",
                "container_id": container_id,
                "forced": force,
                "result": result
            }
        )

        return result
    except Exception as e:
        logger.error(f"Erro ao remover container {container_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/containers/{container_id}/exec", response_model=ContainerExecResponse)
async def exec_in_container(
    container_id: str,
    exec_request: ContainerExecRequest
):
    """Executa comando em container"""
    try:
        logger.info(f"Executando comando no container {container_id}")
        result = await docker_service.exec_in_container(container_id, exec_request)
        return result
    except Exception as e:
        logger.error(f"Erro ao executar comando no container {container_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/containers/{container_id}/logs", response_model=List[LogEntry])
async def get_container_logs(
    container_id: str,
    stdout: bool = Query(default=True, description="Incluir stdout"),
    stderr: bool = Query(default=True, description="Incluir stderr"),
    timestamps: bool = Query(default=True, description="Incluir timestamps"),
    tail: Optional[int] = Query(default=None, description="Últimas N linhas"),
    since: Optional[str] = Query(default=None, description="Logs desde timestamp"),
    until: Optional[str] = Query(default=None, description="Logs até timestamp")
):
    """Obtém logs de um container"""
    try:
        logs_request = LogsRequest(
            stdout=stdout,
            stderr=stderr,
            timestamps=timestamps,
            tail=tail,
            since=since,
            until=until
        )
        logs = await docker_service.get_container_logs(container_id, logs_request)
        return logs
    except Exception as e:
        logger.error(f"Erro ao obter logs do container {container_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/containers/{container_id}/stats", response_model=ContainerStats)
async def get_container_stats(container_id: str):
    """Obtém estatísticas de um container"""
    try:
        stats = await docker_service.get_container_stats(container_id)
        return stats
    except Exception as e:
        logger.error(f"Erro ao obter estatísticas do container {container_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ===========================
# IMAGE ENDPOINTS
# ===========================

@router.get("/images", response_model=List[ImageInfo])
async def list_images(
    all: bool = Query(default=False, description="Incluir imagens intermediárias"),
    dangling: Optional[bool] = Query(default=None, description="Filtrar imagens órfãs"),
    name: Optional[str] = Query(default=None, description="Filtrar por nome")
):
    """Lista imagens Docker"""
    try:
        request = ImageListRequest(all=all, dangling=dangling, name=name)
        images = await docker_service.list_images(request)
        return images
    except Exception as e:
        logger.error(f"Erro ao listar imagens: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/images/pull", response_model=DockerOperationResponse)
async def pull_image(
    pull_request: ImagePullRequest,
    background_tasks: BackgroundTasks
):
    """Faz pull de uma imagem Docker"""
    try:
        logger.info(f"Fazendo pull da imagem: {pull_request.repository}:{pull_request.tag}")
        result = await docker_service.pull_image(pull_request)

        # Enviar callback assíncrono
        background_tasks.add_task(
            callback_manager.send_callback,
            "/docker/image/pulled",
            {
                "operation": "image_pull",
                "repository": pull_request.repository,
                "tag": pull_request.tag,
                "result": result
            }
        )

        return result
    except Exception as e:
        logger.error(f"Erro ao fazer pull da imagem: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/images/{image_id}", response_model=DockerOperationResponse)
async def remove_image(
    image_id: str,
    background_tasks: BackgroundTasks,
    force: bool = Query(default=False, description="Forçar remoção"),
    noprune: bool = Query(default=False, description="Não remover imagens pai")
):
    """Remove uma imagem Docker"""
    try:
        logger.info(f"Removendo imagem {image_id}")
        remove_request = ImageRemoveRequest(force=force, noprune=noprune)
        result = await docker_service.remove_image(image_id, remove_request)

        # Enviar callback assíncrono
        background_tasks.add_task(
            callback_manager.send_callback,
            "/docker/image/removed",
            {
                "operation": "image_remove",
                "image_id": image_id,
                "forced": force,
                "result": result
            }
        )

        return result
    except Exception as e:
        logger.error(f"Erro ao remover imagem {image_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ===========================
# VOLUME ENDPOINTS
# ===========================

@router.get("/volumes", response_model=List[VolumeInfo])
async def list_volumes(
    dangling: Optional[bool] = Query(default=None, description="Filtrar volumes órfãos"),
    driver: Optional[str] = Query(default=None, description="Filtrar por driver"),
    label: Optional[str] = Query(default=None, description="Filtrar por label")
):
    """Lista volumes Docker"""
    try:
        request = VolumeListRequest(dangling=dangling, driver=driver, label=label)
        volumes = await docker_service.list_volumes(request)
        return volumes
    except Exception as e:
        logger.error(f"Erro ao listar volumes: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/volumes", response_model=DockerOperationResponse)
async def create_volume(
    volume_request: CreateVolumeRequest,
    background_tasks: BackgroundTasks
):
    """Cria um novo volume Docker"""
    try:
        logger.info(f"Criando volume: {volume_request.name}")
        result = await docker_service.create_volume(volume_request)

        # Enviar callback assíncrono
        background_tasks.add_task(
            callback_manager.send_callback,
            "/docker/volume/created",
            {
                "operation": "volume_create",
                "volume_name": volume_request.name,
                "driver": volume_request.driver,
                "result": result
            }
        )

        return result
    except Exception as e:
        logger.error(f"Erro ao criar volume: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/volumes/{volume_name}", response_model=DockerOperationResponse)
async def remove_volume(
    volume_name: str,
    background_tasks: BackgroundTasks,
    force: bool = Query(default=False, description="Forçar remoção")
):
    """Remove um volume Docker"""
    try:
        logger.info(f"Removendo volume {volume_name}")
        result = await docker_service.remove_volume(volume_name, force)

        # Enviar callback assíncrono
        background_tasks.add_task(
            callback_manager.send_callback,
            "/docker/volume/removed",
            {
                "operation": "volume_remove",
                "volume_name": volume_name,
                "forced": force,
                "result": result
            }
        )

        return result
    except Exception as e:
        logger.error(f"Erro ao remover volume {volume_name}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ===========================
# NETWORK ENDPOINTS
# ===========================

@router.get("/networks", response_model=List[NetworkInfo])
async def list_networks():
    """Lista redes Docker"""
    try:
        networks = await docker_service.list_networks()
        return networks
    except Exception as e:
        logger.error(f"Erro ao listar redes: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/networks", response_model=DockerOperationResponse)
async def create_network(
    network_request: CreateNetworkRequest,
    background_tasks: BackgroundTasks
):
    """Cria uma nova rede Docker"""
    try:
        logger.info(f"Criando rede: {network_request.name}")
        result = await docker_service.create_network(network_request)

        # Enviar callback assíncrono
        background_tasks.add_task(
            callback_manager.send_callback,
            "/docker/network/created",
            {
                "operation": "network_create",
                "network_name": network_request.name,
                "driver": network_request.driver,
                "result": result
            }
        )

        return result
    except Exception as e:
        logger.error(f"Erro ao criar rede: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/networks/{network_id}", response_model=DockerOperationResponse)
async def remove_network(
    network_id: str,
    background_tasks: BackgroundTasks
):
    """Remove uma rede Docker"""
    try:
        logger.info(f"Removendo rede {network_id}")
        result = await docker_service.remove_network(network_id)

        # Enviar callback assíncrono
        background_tasks.add_task(
            callback_manager.send_callback,
            "/docker/network/removed",
            {
                "operation": "network_remove",
                "network_id": network_id,
                "result": result
            }
        )

        return result
    except Exception as e:
        logger.error(f"Erro ao remover rede {network_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/networks/{network_id}/connect", response_model=DockerOperationResponse)
async def connect_container_to_network(
    network_id: str,
    connect_request: NetworkConnectRequest,
    background_tasks: BackgroundTasks
):
    """Conecta container à rede"""
    try:
        logger.info(f"Conectando container {connect_request.container} à rede {network_id}")
        result = await docker_service.connect_container_to_network(network_id, connect_request)

        # Enviar callback assíncrono
        background_tasks.add_task(
            callback_manager.send_callback,
            "/docker/network/connected",
            {
                "operation": "network_connect",
                "network_id": network_id,
                "container": connect_request.container,
                "result": result
            }
        )

        return result
    except Exception as e:
        logger.error(f"Erro ao conectar container à rede: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/networks/{network_id}/disconnect", response_model=DockerOperationResponse)
async def disconnect_container_from_network(
    network_id: str,
    disconnect_request: NetworkDisconnectRequest,
    background_tasks: BackgroundTasks
):
    """Desconecta container da rede"""
    try:
        logger.info(f"Desconectando container {disconnect_request.container} da rede {network_id}")
        result = await docker_service.disconnect_container_from_network(network_id, disconnect_request)

        # Enviar callback assíncrono
        background_tasks.add_task(
            callback_manager.send_callback,
            "/docker/network/disconnected",
            {
                "operation": "network_disconnect",
                "network_id": network_id,
                "container": disconnect_request.container,
                "result": result
            }
        )

        return result
    except Exception as e:
        logger.error(f"Erro ao desconectar container da rede: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ===========================
# SYSTEM ENDPOINTS
# ===========================

@router.get("/health", response_model=DockerHealthResponse)
async def docker_health():
    """Verifica saúde do serviço Docker"""
    try:
        health = await docker_service.get_docker_health()
        return health
    except Exception as e:
        logger.error(f"Erro ao verificar saúde do Docker: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/system/info", response_model=DockerSystemInfo)
async def docker_system_info():
    """Obtém informações do sistema Docker"""
    try:
        info = await docker_service.get_system_info()
        return info
    except Exception as e:
        logger.error(f"Erro ao obter informações do sistema Docker: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/system/prune", response_model=DockerOperationResponse)
async def docker_system_prune(
    background_tasks: BackgroundTasks,
    containers: bool = Query(default=True, description="Limpar containers"),
    images: bool = Query(default=True, description="Limpar imagens"),
    volumes: bool = Query(default=False, description="Limpar volumes"),
    networks: bool = Query(default=True, description="Limpar redes")
):
    """Executa limpeza do sistema Docker"""
    try:
        logger.info("Executando limpeza do sistema Docker")
        result = await docker_service.system_prune(containers, images, volumes, networks)

        # Enviar callback assíncrono
        background_tasks.add_task(
            callback_manager.send_callback,
            "/docker/system/pruned",
            {
                "operation": "system_prune",
                "containers": containers,
                "images": images,
                "volumes": volumes,
                "networks": networks,
                "result": result
            }
        )

        return result
    except Exception as e:
        logger.error(f"Erro ao executar limpeza do sistema: {e}")
        raise HTTPException(status_code=500, detail=str(e))