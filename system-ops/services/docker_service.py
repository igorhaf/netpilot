import asyncio
import logging
import time
import json
from datetime import datetime
from typing import Dict, List, Optional, Any, Union
import docker
from docker.errors import DockerException, NotFound, APIError, ImageNotFound, ContainerError

from models.docker import (
    ContainerInfo, ContainerInspectInfo, CreateContainerRequest, ContainerActionRequest,
    ContainerListRequest, ImageInfo, ImageListRequest, ImagePullRequest, ImageRemoveRequest,
    VolumeInfo, CreateVolumeRequest, VolumeListRequest, NetworkInfo, CreateNetworkRequest,
    NetworkConnectRequest, NetworkDisconnectRequest, ContainerStats, LogEntry, LogsRequest,
    DockerOperationResponse, DockerHealthResponse, DockerSystemInfo,
    ContainerExecRequest, ContainerExecResponse, ContainerPort, ContainerMount
)

logger = logging.getLogger(__name__)

class DockerService:
    """Serviço para gerenciar operações Docker"""

    def __init__(self):
        self.client: Optional[docker.DockerClient] = None
        self.api_client: Optional[docker.APIClient] = None
        self.service_started_at = datetime.now()

    async def start_service(self):
        """Inicia o serviço Docker"""
        try:
            logger.info("🐳 Iniciando serviço Docker...")

            # Inicializar clientes Docker
            self.client = docker.from_env()
            self.api_client = docker.APIClient()

            # Verificar conectividade
            await self._verify_docker_connection()

            logger.info("✅ Serviço Docker iniciado com sucesso")

        except Exception as e:
            logger.error(f"❌ Erro ao iniciar serviço Docker: {e}")
            raise

    async def stop_service(self):
        """Para o serviço Docker"""
        try:
            logger.info("🐳 Parando serviço Docker...")

            if self.client:
                self.client.close()

            if self.api_client:
                self.api_client.close()

            logger.info("✅ Serviço Docker parado")

        except Exception as e:
            logger.error(f"❌ Erro ao parar serviço Docker: {e}")

    # ===========================
    # OPERAÇÕES DE CONTAINERS
    # ===========================

    async def list_containers(self, request: ContainerListRequest) -> List[ContainerInfo]:
        """Lista containers"""
        try:
            logger.info(f"📋 Listando containers (all={request.all})")

            # Preparar filtros
            filters = {}
            if request.status:
                filters['status'] = request.status
            if request.image:
                filters['ancestor'] = request.image
            if request.name:
                filters['name'] = request.name
            if request.label:
                filters['label'] = request.label

            # Listar containers
            containers = self.client.containers.list(all=request.all, filters=filters)

            # Converter para modelo
            container_infos = []
            for container in containers:
                container_info = await self._convert_container_to_info(container)
                container_infos.append(container_info)

            logger.info(f"✅ {len(container_infos)} containers encontrados")
            return container_infos

        except Exception as e:
            logger.error(f"❌ Erro ao listar containers: {e}")
            raise

    async def get_container(self, container_id: str) -> ContainerInspectInfo:
        """Obtém informações detalhadas de um container"""
        try:
            logger.info(f"🔍 Obtendo container: {container_id}")

            container = self.client.containers.get(container_id)
            container.reload()

            # Converter dados para o modelo
            info = ContainerInspectInfo(
                id=container.id,
                name=container.name,
                config=container.attrs.get('Config', {}),
                host_config=container.attrs.get('HostConfig', {}),
                network_settings=container.attrs.get('NetworkSettings', {}),
                state=container.attrs.get('State', {}),
                mounts=container.attrs.get('Mounts', [])
            )

            logger.info(f"✅ Container {container_id} encontrado")
            return info

        except NotFound:
            logger.error(f"❌ Container {container_id} não encontrado")
            raise ValueError(f"Container {container_id} não encontrado")
        except Exception as e:
            logger.error(f"❌ Erro ao obter container {container_id}: {e}")
            raise

    async def create_container(self, request: CreateContainerRequest) -> DockerOperationResponse:
        """Cria um novo container"""
        try:
            logger.info(f"🆕 Criando container: {request.name}")

            # Preparar configuração
            create_kwargs = {
                'image': request.image,
                'name': request.name,
                'detach': True
            }

            # Configurar variáveis de ambiente
            if request.env:
                create_kwargs['environment'] = request.env

            # Configurar comando
            if request.command:
                create_kwargs['command'] = request.command

            # Configurar diretório de trabalho
            if request.working_dir:
                create_kwargs['working_dir'] = request.working_dir

            # Configurar portas
            if request.ports:
                ports = {}
                port_bindings = {}
                for container_port, host_ports in request.ports.items():
                    ports[container_port] = None
                    port_bindings[container_port] = [hp for hp in host_ports]

                create_kwargs['ports'] = ports
                create_kwargs['port_bindings'] = port_bindings

            # Configurar volumes
            if request.volumes:
                volumes = {}
                binds = []
                for vol in request.volumes:
                    if vol.get('type') == 'bind':
                        bind_str = f"{vol['source']}:{vol['target']}"
                        if vol.get('readonly', False):
                            bind_str += ':ro'
                        binds.append(bind_str)
                    else:
                        volumes[vol['target']] = None

                if volumes:
                    create_kwargs['volumes'] = volumes
                if binds:
                    create_kwargs['binds'] = binds

            # Configurar rede
            if request.networks:
                create_kwargs['network'] = request.networks[0] if request.networks else None

            # Configurar política de restart
            if request.restart_policy:
                create_kwargs['restart_policy'] = {'Name': request.restart_policy}

            # Configurar auto remove
            if request.auto_remove:
                create_kwargs['auto_remove'] = True

            # Criar container
            container = self.client.containers.create(**create_kwargs)

            # Conectar a redes adicionais
            if request.networks and len(request.networks) > 1:
                for network_name in request.networks[1:]:
                    try:
                        network = self.client.networks.get(network_name)
                        network.connect(container)
                    except Exception as net_error:
                        logger.warning(f"⚠️ Erro ao conectar à rede {network_name}: {net_error}")

            logger.info(f"✅ Container {request.name} criado: {container.id}")

            return DockerOperationResponse(
                success=True,
                message=f"Container {request.name} criado com sucesso",
                data={'container_id': container.id, 'name': request.name},
                operation='create_container'
            )

        except ImageNotFound:
            logger.error(f"❌ Imagem {request.image} não encontrada")
            raise ValueError(f"Imagem {request.image} não encontrada")
        except APIError as e:
            if e.status_code == 409:
                logger.error(f"❌ Container {request.name} já existe")
                raise ValueError(f"Container com nome {request.name} já existe")
            logger.error(f"❌ Erro da API Docker: {e}")
            raise
        except Exception as e:
            logger.error(f"❌ Erro ao criar container: {e}")
            raise

    async def container_action(self, container_id: str, request: ContainerActionRequest) -> DockerOperationResponse:
        """Executa ação em container"""
        try:
            logger.info(f"⚡ Executando ação {request.action} no container {container_id}")

            container = self.client.containers.get(container_id)

            # Executar ação
            if request.action == 'start':
                container.start()
            elif request.action == 'stop':
                container.stop(timeout=request.timeout)
            elif request.action == 'restart':
                container.restart(timeout=request.timeout)
            elif request.action == 'pause':
                container.pause()
            elif request.action == 'unpause':
                container.unpause()
            elif request.action == 'kill':
                container.kill()

            # Recarregar status
            container.reload()

            logger.info(f"✅ Ação {request.action} executada no container {container_id}")

            return DockerOperationResponse(
                success=True,
                message=f"Ação {request.action} executada com sucesso",
                data={'container_id': container_id, 'status': container.status},
                operation=f'container_{request.action}'
            )

        except NotFound:
            logger.error(f"❌ Container {container_id} não encontrado")
            raise ValueError(f"Container {container_id} não encontrado")
        except Exception as e:
            logger.error(f"❌ Erro ao executar ação {request.action}: {e}")
            raise

    async def remove_container(self, container_id: str, force: bool = False) -> DockerOperationResponse:
        """Remove um container"""
        try:
            logger.info(f"🗑️ Removendo container: {container_id}")

            container = self.client.containers.get(container_id)
            container.remove(force=force)

            logger.info(f"✅ Container {container_id} removido")

            return DockerOperationResponse(
                success=True,
                message="Container removido com sucesso",
                data={'container_id': container_id},
                operation='remove_container'
            )

        except NotFound:
            logger.error(f"❌ Container {container_id} não encontrado")
            raise ValueError(f"Container {container_id} não encontrado")
        except Exception as e:
            logger.error(f"❌ Erro ao remover container: {e}")
            raise

    async def get_container_logs(self, container_id: str, request: LogsRequest) -> List[LogEntry]:
        """Obtém logs de um container"""
        try:
            logger.info(f"📄 Obtendo logs do container: {container_id}")

            container = self.client.containers.get(container_id)

            # Configurar parâmetros de log
            logs_kwargs = {
                'stdout': request.stdout,
                'stderr': request.stderr,
                'timestamps': request.timestamps,
                'stream': False
            }

            if request.tail:
                logs_kwargs['tail'] = request.tail
            if request.since:
                logs_kwargs['since'] = request.since
            if request.until:
                logs_kwargs['until'] = request.until

            # Obter logs
            logs = container.logs(**logs_kwargs)

            # Processar logs
            log_entries = []
            if isinstance(logs, bytes):
                logs = logs.decode('utf-8')

            for line in logs.split('\n'):
                if line.strip():
                    # Parse básico de timestamp se disponível
                    if request.timestamps and ' ' in line:
                        parts = line.split(' ', 1)
                        try:
                            timestamp = datetime.fromisoformat(parts[0].replace('Z', '+00:00'))
                            message = parts[1] if len(parts) > 1 else ''
                        except:
                            timestamp = datetime.now()
                            message = line
                    else:
                        timestamp = datetime.now()
                        message = line

                    log_entries.append(LogEntry(
                        timestamp=timestamp,
                        stream='stdout',  # Simplificado, em produção seria mais específico
                        message=message
                    ))

            logger.info(f"✅ {len(log_entries)} entradas de log obtidas")
            return log_entries

        except NotFound:
            logger.error(f"❌ Container {container_id} não encontrado")
            raise ValueError(f"Container {container_id} não encontrado")
        except Exception as e:
            logger.error(f"❌ Erro ao obter logs: {e}")
            raise

    async def get_container_stats(self, container_id: str) -> ContainerStats:
        """Obtém estatísticas de um container"""
        try:
            logger.info(f"📊 Obtendo estatísticas do container: {container_id}")

            container = self.client.containers.get(container_id)

            # Obter stats (sem stream)
            stats = container.stats(stream=False, decode=True)

            # Processar estatísticas
            cpu_stats = stats.get('cpu_stats', {})
            precpu_stats = stats.get('precpu_stats', {})
            memory_stats = stats.get('memory_stats', {})
            networks = stats.get('networks', {})
            blkio_stats = stats.get('blkio_stats', {})

            # Calcular CPU usage
            cpu_usage = 0.0
            if cpu_stats.get('cpu_usage') and precpu_stats.get('cpu_usage'):
                cpu_delta = cpu_stats['cpu_usage']['total_usage'] - precpu_stats['cpu_usage']['total_usage']
                system_delta = cpu_stats['system_cpu_usage'] - precpu_stats['system_cpu_usage']
                if system_delta > 0:
                    cpu_usage = (cpu_delta / system_delta) * len(cpu_stats['cpu_usage'].get('percpu_usage', [1])) * 100

            # Calcular memory
            memory_usage = memory_stats.get('usage', 0)
            memory_limit = memory_stats.get('limit', 0)
            memory_percent = (memory_usage / memory_limit * 100) if memory_limit > 0 else 0

            # Calcular network
            network_rx = sum(net.get('rx_bytes', 0) for net in networks.values())
            network_tx = sum(net.get('tx_bytes', 0) for net in networks.values())

            # Calcular block I/O
            block_read = 0
            block_write = 0
            for io_stat in blkio_stats.get('io_service_bytes_recursive', []):
                if io_stat.get('op') == 'Read':
                    block_read += io_stat.get('value', 0)
                elif io_stat.get('op') == 'Write':
                    block_write += io_stat.get('value', 0)

            pids = stats.get('pids_stats', {}).get('current', 0)

            container_stats = ContainerStats(
                container_id=container_id,
                cpu_usage=round(cpu_usage, 2),
                memory_usage=memory_usage,
                memory_limit=memory_limit,
                memory_percent=round(memory_percent, 2),
                network_rx=network_rx,
                network_tx=network_tx,
                block_read=block_read,
                block_write=block_write,
                pids=pids
            )

            logger.info(f"✅ Estatísticas do container {container_id} obtidas")
            return container_stats

        except NotFound:
            logger.error(f"❌ Container {container_id} não encontrado")
            raise ValueError(f"Container {container_id} não encontrado")
        except Exception as e:
            logger.error(f"❌ Erro ao obter estatísticas: {e}")
            raise

    # ===========================
    # OPERAÇÕES DE IMAGENS
    # ===========================

    async def list_images(self, request: ImageListRequest) -> List[ImageInfo]:
        """Lista imagens Docker"""
        try:
            logger.info("📋 Listando imagens Docker")

            # Preparar filtros
            filters = {}
            if request.dangling is not None:
                filters['dangling'] = request.dangling
            if request.name:
                filters['reference'] = request.name

            images = self.client.images.list(all=request.all, filters=filters)

            image_infos = []
            for image in images:
                image_info = ImageInfo(
                    id=image.id,
                    tags=image.tags or [],
                    created=datetime.fromtimestamp(image.attrs['Created']) if 'Created' in image.attrs else datetime.now(),
                    size=image.attrs.get('Size', 0),
                    virtual_size=image.attrs.get('VirtualSize', 0),
                    parent_id=image.attrs.get('Parent'),
                    repo_digests=image.attrs.get('RepoDigests', [])
                )
                image_infos.append(image_info)

            logger.info(f"✅ {len(image_infos)} imagens encontradas")
            return image_infos

        except Exception as e:
            logger.error(f"❌ Erro ao listar imagens: {e}")
            raise

    async def pull_image(self, request: ImagePullRequest) -> DockerOperationResponse:
        """Faz pull de uma imagem Docker"""
        try:
            logger.info(f"⬇️ Fazendo pull da imagem: {request.repository}:{request.tag}")

            # Configurar autenticação se fornecida
            auth_config = None
            if request.auth:
                auth_config = request.auth

            # Fazer pull da imagem
            image = self.client.images.pull(
                repository=request.repository,
                tag=request.tag,
                auth_config=auth_config
            )

            logger.info(f"✅ Pull da imagem {request.repository}:{request.tag} concluído")

            return DockerOperationResponse(
                success=True,
                message=f"Imagem {request.repository}:{request.tag} baixada com sucesso",
                data={'image_id': image.id, 'tags': image.tags},
                operation='pull_image'
            )

        except Exception as e:
            logger.error(f"❌ Erro ao fazer pull da imagem: {e}")
            raise

    async def remove_image(self, image_id: str, request: ImageRemoveRequest) -> DockerOperationResponse:
        """Remove uma imagem Docker"""
        try:
            logger.info(f"🗑️ Removendo imagem: {image_id}")

            # Remover imagem
            self.client.images.remove(
                image=image_id,
                force=request.force,
                noprune=request.noprune
            )

            logger.info(f"✅ Imagem {image_id} removida")

            return DockerOperationResponse(
                success=True,
                message="Imagem removida com sucesso",
                data={'image_id': image_id},
                operation='remove_image'
            )

        except ImageNotFound:
            logger.error(f"❌ Imagem {image_id} não encontrada")
            raise ValueError(f"Imagem {image_id} não encontrada")
        except Exception as e:
            logger.error(f"❌ Erro ao remover imagem: {e}")
            raise

    # ===========================
    # OPERAÇÕES DE VOLUMES
    # ===========================

    async def list_volumes(self, request: VolumeListRequest) -> List[VolumeInfo]:
        """Lista volumes Docker"""
        try:
            logger.info("📋 Listando volumes Docker")

            # Preparar filtros
            filters = {}
            if request.dangling is not None:
                filters['dangling'] = request.dangling
            if request.driver:
                filters['driver'] = request.driver
            if request.label:
                filters['label'] = request.label

            volumes = self.client.volumes.list(filters=filters)

            volume_infos = []
            for volume in volumes:
                volume_info = VolumeInfo(
                    name=volume.name,
                    driver=volume.attrs.get('Driver', 'unknown'),
                    mountpoint=volume.attrs.get('Mountpoint', ''),
                    labels=volume.attrs.get('Labels') or {},
                    options=volume.attrs.get('Options') or {},
                    scope=volume.attrs.get('Scope', 'local'),
                    created_at=datetime.fromisoformat(volume.attrs['CreatedAt'].replace('Z', '+00:00')) if volume.attrs.get('CreatedAt') else datetime.now()
                )
                volume_infos.append(volume_info)

            logger.info(f"✅ {len(volume_infos)} volumes encontrados")
            return volume_infos

        except Exception as e:
            logger.error(f"❌ Erro ao listar volumes: {e}")
            raise

    async def create_volume(self, request: CreateVolumeRequest) -> DockerOperationResponse:
        """Cria um novo volume Docker"""
        try:
            logger.info(f"🆕 Criando volume: {request.name}")

            # Criar volume
            volume = self.client.volumes.create(
                name=request.name,
                driver=request.driver,
                driver_opts=request.driver_opts,
                labels=request.labels
            )

            logger.info(f"✅ Volume {request.name} criado")

            return DockerOperationResponse(
                success=True,
                message=f"Volume {request.name} criado com sucesso",
                data={'volume_name': volume.name, 'driver': volume.attrs.get('Driver')},
                operation='create_volume'
            )

        except APIError as e:
            if e.status_code == 409:
                logger.error(f"❌ Volume {request.name} já existe")
                raise ValueError(f"Volume com nome {request.name} já existe")
            logger.error(f"❌ Erro da API Docker: {e}")
            raise
        except Exception as e:
            logger.error(f"❌ Erro ao criar volume: {e}")
            raise

    async def remove_volume(self, volume_name: str, force: bool = False) -> DockerOperationResponse:
        """Remove um volume Docker"""
        try:
            logger.info(f"🗑️ Removendo volume: {volume_name}")

            volume = self.client.volumes.get(volume_name)
            volume.remove(force=force)

            logger.info(f"✅ Volume {volume_name} removido")

            return DockerOperationResponse(
                success=True,
                message="Volume removido com sucesso",
                data={'volume_name': volume_name},
                operation='remove_volume'
            )

        except NotFound:
            logger.error(f"❌ Volume {volume_name} não encontrado")
            raise ValueError(f"Volume {volume_name} não encontrado")
        except Exception as e:
            logger.error(f"❌ Erro ao remover volume: {e}")
            raise

    # ===========================
    # OPERAÇÕES DE REDES
    # ===========================

    async def list_networks(self) -> List[NetworkInfo]:
        """Lista redes Docker"""
        try:
            logger.info("📋 Listando redes Docker")

            networks = self.client.networks.list()

            network_infos = []
            for network in networks:
                network_info = NetworkInfo(
                    id=network.id,
                    name=network.name,
                    driver=network.attrs.get('Driver', 'unknown'),
                    scope=network.attrs.get('Scope', 'local'),
                    ipam=network.attrs.get('IPAM', {}),
                    containers=network.attrs.get('Containers', {}),
                    options=network.attrs.get('Options') or {},
                    labels=network.attrs.get('Labels') or {},
                    created=datetime.fromisoformat(network.attrs['Created'].replace('Z', '+00:00')) if network.attrs.get('Created') else datetime.now()
                )
                network_infos.append(network_info)

            logger.info(f"✅ {len(network_infos)} redes encontradas")
            return network_infos

        except Exception as e:
            logger.error(f"❌ Erro ao listar redes: {e}")
            raise

    async def create_network(self, request: CreateNetworkRequest) -> DockerOperationResponse:
        """Cria uma nova rede Docker"""
        try:
            logger.info(f"🆕 Criando rede: {request.name}")

            # Criar rede
            network = self.client.networks.create(
                name=request.name,
                driver=request.driver,
                options=request.options,
                ipam=request.ipam,
                check_duplicate=request.check_duplicate,
                internal=request.internal,
                enable_ipv6=request.enable_ipv6,
                labels=request.labels
            )

            logger.info(f"✅ Rede {request.name} criada")

            return DockerOperationResponse(
                success=True,
                message=f"Rede {request.name} criada com sucesso",
                data={'network_id': network.id, 'network_name': network.name},
                operation='create_network'
            )

        except APIError as e:
            if e.status_code == 409:
                logger.error(f"❌ Rede {request.name} já existe")
                raise ValueError(f"Rede com nome {request.name} já existe")
            logger.error(f"❌ Erro da API Docker: {e}")
            raise
        except Exception as e:
            logger.error(f"❌ Erro ao criar rede: {e}")
            raise

    async def remove_network(self, network_id: str) -> DockerOperationResponse:
        """Remove uma rede Docker"""
        try:
            logger.info(f"🗑️ Removendo rede: {network_id}")

            network = self.client.networks.get(network_id)
            network.remove()

            logger.info(f"✅ Rede {network_id} removida")

            return DockerOperationResponse(
                success=True,
                message="Rede removida com sucesso",
                data={'network_id': network_id},
                operation='remove_network'
            )

        except NotFound:
            logger.error(f"❌ Rede {network_id} não encontrada")
            raise ValueError(f"Rede {network_id} não encontrada")
        except Exception as e:
            logger.error(f"❌ Erro ao remover rede: {e}")
            raise

    async def connect_container_to_network(self, network_id: str, request: NetworkConnectRequest) -> DockerOperationResponse:
        """Conecta container à rede"""
        try:
            logger.info(f"🔗 Conectando container {request.container} à rede {network_id}")

            network = self.client.networks.get(network_id)

            # Preparar configuração da conexão
            kwargs = {}
            if request.aliases:
                kwargs['aliases'] = request.aliases
            if request.ipv4_address:
                kwargs['ipv4_address'] = request.ipv4_address
            if request.ipv6_address:
                kwargs['ipv6_address'] = request.ipv6_address

            network.connect(request.container, **kwargs)

            logger.info(f"✅ Container {request.container} conectado à rede {network_id}")

            return DockerOperationResponse(
                success=True,
                message="Container conectado à rede com sucesso",
                data={'network_id': network_id, 'container': request.container},
                operation='connect_network'
            )

        except NotFound as e:
            if 'network' in str(e).lower():
                logger.error(f"❌ Rede {network_id} não encontrada")
                raise ValueError(f"Rede {network_id} não encontrada")
            else:
                logger.error(f"❌ Container {request.container} não encontrado")
                raise ValueError(f"Container {request.container} não encontrado")
        except Exception as e:
            logger.error(f"❌ Erro ao conectar container à rede: {e}")
            raise

    async def disconnect_container_from_network(self, network_id: str, request: NetworkDisconnectRequest) -> DockerOperationResponse:
        """Desconecta container da rede"""
        try:
            logger.info(f"❌ Desconectando container {request.container} da rede {network_id}")

            network = self.client.networks.get(network_id)
            network.disconnect(request.container, force=request.force)

            logger.info(f"✅ Container {request.container} desconectado da rede {network_id}")

            return DockerOperationResponse(
                success=True,
                message="Container desconectado da rede com sucesso",
                data={'network_id': network_id, 'container': request.container},
                operation='disconnect_network'
            )

        except NotFound as e:
            if 'network' in str(e).lower():
                logger.error(f"❌ Rede {network_id} não encontrada")
                raise ValueError(f"Rede {network_id} não encontrada")
            else:
                logger.error(f"❌ Container {request.container} não encontrado")
                raise ValueError(f"Container {request.container} não encontrado")
        except Exception as e:
            logger.error(f"❌ Erro ao desconectar container da rede: {e}")
            raise

    # ===========================
    # OPERAÇÕES DE EXEC
    # ===========================

    async def exec_in_container(self, container_id: str, request: ContainerExecRequest) -> ContainerExecResponse:
        """Executa comando em container"""
        try:
            logger.info(f"⚡ Executando comando no container {container_id}")

            container = self.client.containers.get(container_id)

            # Criar exec
            exec_instance = self.api_client.exec_create(
                container=container_id,
                cmd=request.cmd,
                stdout=True,
                stderr=True,
                stdin=request.interactive,
                tty=request.tty,
                environment=request.env,
                workdir=request.working_dir,
                user=request.user
            )

            # Executar comando
            exec_result = self.api_client.exec_start(
                exec_id=exec_instance['Id'],
                detach=False,
                tty=request.tty
            )

            # Obter informações da execução
            exec_info = self.api_client.exec_inspect(exec_instance['Id'])

            # Processar output
            if isinstance(exec_result, bytes):
                output = exec_result.decode('utf-8')
            else:
                output = str(exec_result)

            logger.info(f"✅ Comando executado no container {container_id}")

            return ContainerExecResponse(
                exec_id=exec_instance['Id'],
                exit_code=exec_info.get('ExitCode'),
                output=output,
                error=None if exec_info.get('ExitCode') == 0 else "Command failed"
            )

        except NotFound:
            logger.error(f"❌ Container {container_id} não encontrado")
            raise ValueError(f"Container {container_id} não encontrado")
        except Exception as e:
            logger.error(f"❌ Erro ao executar comando: {e}")
            raise

    async def inspect_container(self, container_id: str) -> ContainerInspectInfo:
        """Obtém informações detalhadas de um container (alias para get_container)"""
        return await self.get_container(container_id)

    # ===========================
    # OPERAÇÕES DE SISTEMA
    # ===========================

    async def system_prune(self, containers: bool = True, images: bool = True,
                          volumes: bool = False, networks: bool = True) -> DockerOperationResponse:
        """Executa limpeza do sistema Docker"""
        try:
            logger.info("🧹 Executando limpeza do sistema Docker")

            pruned_data = {}

            # Limpar containers parados
            if containers:
                container_prune = self.client.containers.prune()
                pruned_data['containers'] = container_prune

            # Limpar imagens não utilizadas
            if images:
                image_prune = self.client.images.prune(filters={'dangling': False})
                pruned_data['images'] = image_prune

            # Limpar volumes não utilizados
            if volumes:
                volume_prune = self.client.volumes.prune()
                pruned_data['volumes'] = volume_prune

            # Limpar redes não utilizadas
            if networks:
                network_prune = self.client.networks.prune()
                pruned_data['networks'] = network_prune

            logger.info("✅ Limpeza do sistema Docker concluída")

            return DockerOperationResponse(
                success=True,
                message="Limpeza do sistema Docker concluída com sucesso",
                data=pruned_data,
                operation='system_prune'
            )

        except Exception as e:
            logger.error(f"❌ Erro na limpeza do sistema: {e}")
            raise

    async def get_docker_health(self) -> DockerHealthResponse:
        """Obtém status de saúde do Docker (alias para get_health_status)"""
        return await self.get_health_status()

    # ===========================
    # SISTEMA E HEALTH CHECK
    # ===========================

    async def get_system_info(self) -> DockerSystemInfo:
        """Obtém informações do sistema Docker"""
        try:
            logger.info("🔍 Obtendo informações do sistema Docker")

            info = self.client.info()
            version = self.client.version()

            system_info = DockerSystemInfo(
                version=version.get('Version', 'unknown'),
                api_version=version.get('ApiVersion', 'unknown'),
                containers=info.get('Containers', 0),
                containers_running=info.get('ContainersRunning', 0),
                containers_paused=info.get('ContainersPaused', 0),
                containers_stopped=info.get('ContainersStopped', 0),
                images=info.get('Images', 0),
                volumes=len(self.client.volumes.list()),
                networks=len(self.client.networks.list()),
                server_version=info.get('ServerVersion', 'unknown'),
                storage_driver=info.get('Driver', 'unknown'),
                total_memory=info.get('MemTotal', 0),
                cpu_count=info.get('NCPU', 0),
                kernel_version=info.get('KernelVersion', 'unknown'),
                operating_system=info.get('OperatingSystem', 'unknown'),
                architecture=info.get('Architecture', 'unknown')
            )

            logger.info("✅ Informações do sistema Docker obtidas")
            return system_info

        except Exception as e:
            logger.error(f"❌ Erro ao obter informações do sistema: {e}")
            raise

    async def get_health_status(self) -> DockerHealthResponse:
        """Obtém status de saúde do serviço Docker"""
        try:
            # Verificar conectividade
            ping_result = self.client.ping()

            if not ping_result:
                return DockerHealthResponse(
                    status="unhealthy",
                    docker_version="unknown",
                    containers_running=0,
                    containers_total=0,
                    images_total=0,
                    volumes_total=0,
                    networks_total=0,
                    message="Docker daemon não está acessível"
                )

            # Obter informações
            info = self.client.info()
            version = self.client.version()

            # Contadores
            containers_running = info.get('ContainersRunning', 0)
            containers_total = info.get('Containers', 0)
            images_total = info.get('Images', 0)

            try:
                volumes_total = len(self.client.volumes.list())
                networks_total = len(self.client.networks.list())
            except:
                volumes_total = 0
                networks_total = 0

            # Determinar status
            if containers_running > 0:
                status = "healthy"
                message = f"Docker funcionando com {containers_running} containers ativos"
            else:
                status = "healthy"
                message = "Docker funcionando, nenhum container ativo"

            return DockerHealthResponse(
                status=status,
                docker_version=version.get('Version', 'unknown'),
                containers_running=containers_running,
                containers_total=containers_total,
                images_total=images_total,
                volumes_total=volumes_total,
                networks_total=networks_total,
                message=message
            )

        except Exception as e:
            logger.error(f"❌ Erro no health check Docker: {e}")
            return DockerHealthResponse(
                status="unhealthy",
                docker_version="unknown",
                containers_running=0,
                containers_total=0,
                images_total=0,
                volumes_total=0,
                networks_total=0,
                message=f"Erro: {str(e)}"
            )

    # ===========================
    # MÉTODOS AUXILIARES
    # ===========================

    async def _verify_docker_connection(self):
        """Verifica conectividade com Docker"""
        try:
            ping_result = self.client.ping()
            if ping_result:
                version = self.client.version()
                logger.info(f"✅ Docker conectado - Versão: {version.get('Version', 'unknown')}")
            else:
                raise Exception("Ping falhou")
        except Exception as e:
            raise Exception(f"Não foi possível conectar ao Docker: {e}")

    async def _convert_container_to_info(self, container) -> ContainerInfo:
        """Converte container Docker para modelo ContainerInfo"""
        try:
            # Processar portas
            ports = []
            if container.attrs.get('NetworkSettings', {}).get('Ports'):
                for private_port, host_ports in container.attrs['NetworkSettings']['Ports'].items():
                    if '/' in private_port:
                        port_num, port_type = private_port.split('/')
                        port_info = ContainerPort(
                            private_port=int(port_num),
                            type=port_type
                        )
                        if host_ports:
                            for host_port in host_ports:
                                if host_port.get('HostPort'):
                                    port_info.public_port = int(host_port['HostPort'])
                                    break
                        ports.append(port_info)

            # Processar montagens
            mounts = []
            for mount in container.attrs.get('Mounts', []):
                mount_info = ContainerMount(
                    type=mount.get('Type', 'unknown'),
                    source=mount.get('Source', ''),
                    destination=mount.get('Destination', ''),
                    readonly=mount.get('RW', True) == False
                )
                mounts.append(mount_info)

            # Processar redes
            networks = []
            network_settings = container.attrs.get('NetworkSettings', {})
            if network_settings.get('Networks'):
                networks = list(network_settings['Networks'].keys())

            return ContainerInfo(
                id=container.id,
                name=container.name,
                image=container.image.tags[0] if container.image.tags else container.image.id,
                image_id=container.image.id,
                status=container.status,
                state=container.attrs.get('State', {}).get('Status', 'unknown'),
                created=datetime.fromisoformat(container.attrs['Created'].replace('Z', '+00:00')),
                ports=ports,
                labels=container.labels or {},
                networks=networks,
                mounts=mounts
            )

        except Exception as e:
            logger.warning(f"⚠️ Erro ao converter container {container.id}: {e}")
            # Retornar informações básicas em caso de erro
            return ContainerInfo(
                id=container.id,
                name=container.name,
                image=str(container.image.id),
                image_id=container.image.id,
                status=container.status,
                state='unknown',
                created=datetime.now(),
                ports=[],
                labels={},
                networks=[],
                mounts=[]
            )

# Instância global do serviço
docker_service = DockerService()