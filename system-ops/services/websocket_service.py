"""
WebSocket Service para streaming em tempo real
Gerencia conexões WebSocket para logs Docker e métricas do sistema
"""

import asyncio
import json
import logging
from datetime import datetime
from typing import Dict, Set, Optional, Any
from fastapi import WebSocket, WebSocketDisconnect
import websockets
from websockets.exceptions import ConnectionClosed

from services.docker_service import docker_service
from models.docker import LogsRequest, ContainerListRequest

logger = logging.getLogger(__name__)

class ConnectionManager:
    """Gerenciador de conexões WebSocket"""

    def __init__(self):
        # Conexões ativas por tipo de stream
        self.docker_logs_connections: Dict[str, Set[WebSocket]] = {}  # container_id -> set de websockets
        self.system_metrics_connections: Set[WebSocket] = set()
        self.docker_events_connections: Set[WebSocket] = set()

        # Tarefas de streaming ativas
        self.active_log_streams: Dict[str, asyncio.Task] = {}  # container_id -> task
        self.metrics_stream_task: Optional[asyncio.Task] = None
        self.docker_events_task: Optional[asyncio.Task] = None

    async def connect_docker_logs(self, websocket: WebSocket, container_id: str):
        """Conecta WebSocket para logs de um container específico"""
        await websocket.accept()

        if container_id not in self.docker_logs_connections:
            self.docker_logs_connections[container_id] = set()

        self.docker_logs_connections[container_id].add(websocket)

        # Iniciar stream de logs se não existir
        if container_id not in self.active_log_streams:
            self.active_log_streams[container_id] = asyncio.create_task(
                self._stream_docker_logs(container_id)
            )

        logger.info(f"✅ WebSocket conectado para logs do container {container_id}")

    async def disconnect_docker_logs(self, websocket: WebSocket, container_id: str):
        """Desconecta WebSocket dos logs de container"""
        if container_id in self.docker_logs_connections:
            self.docker_logs_connections[container_id].discard(websocket)

            # Se não há mais conexões para este container, parar o stream
            if not self.docker_logs_connections[container_id]:
                del self.docker_logs_connections[container_id]

                if container_id in self.active_log_streams:
                    self.active_log_streams[container_id].cancel()
                    del self.active_log_streams[container_id]

                logger.info(f"🛑 Stream de logs parado para container {container_id}")

    async def connect_system_metrics(self, websocket: WebSocket):
        """Conecta WebSocket para métricas do sistema"""
        await websocket.accept()
        self.system_metrics_connections.add(websocket)

        # Iniciar stream de métricas se necessário
        if not self.metrics_stream_task:
            self.metrics_stream_task = asyncio.create_task(self._stream_system_metrics())

        logger.info("✅ WebSocket conectado para métricas do sistema")

    async def disconnect_system_metrics(self, websocket: WebSocket):
        """Desconecta WebSocket das métricas do sistema"""
        self.system_metrics_connections.discard(websocket)

        # Parar stream se não há mais conexões
        if not self.system_metrics_connections and self.metrics_stream_task:
            self.metrics_stream_task.cancel()
            self.metrics_stream_task = None
            logger.info("🛑 Stream de métricas do sistema parado")

    async def connect_docker_events(self, websocket: WebSocket):
        """Conecta WebSocket para eventos do Docker"""
        await websocket.accept()
        self.docker_events_connections.add(websocket)

        # Iniciar stream de eventos se necessário
        if not self.docker_events_task:
            self.docker_events_task = asyncio.create_task(self._stream_docker_events())

        logger.info("✅ WebSocket conectado para eventos do Docker")

    async def disconnect_docker_events(self, websocket: WebSocket):
        """Desconecta WebSocket dos eventos do Docker"""
        self.docker_events_connections.discard(websocket)

        # Parar stream se não há mais conexões
        if not self.docker_events_connections and self.docker_events_task:
            self.docker_events_task.cancel()
            self.docker_events_task = None
            logger.info("🛑 Stream de eventos do Docker parado")

    async def _stream_docker_logs(self, container_id: str):
        """Stream contínuo de logs de um container específico"""
        try:
            logger.info(f"📡 Iniciando stream de logs para container {container_id}")

            # Configurar stream de logs
            container = docker_service.client.containers.get(container_id)

            # Stream de logs com follow=True
            log_stream = container.logs(
                stream=True,
                follow=True,
                timestamps=True,
                stdout=True,
                stderr=True
            )

            for log_line in log_stream:
                if container_id not in self.docker_logs_connections:
                    break

                # Processar linha do log
                if isinstance(log_line, bytes):
                    log_text = log_line.decode('utf-8').strip()
                else:
                    log_text = str(log_line).strip()

                if log_text:
                    # Criar mensagem WebSocket
                    message = {
                        "type": "docker_log",
                        "container_id": container_id,
                        "timestamp": datetime.now().isoformat(),
                        "message": log_text
                    }

                    # Enviar para todas as conexões deste container
                    await self._broadcast_to_container_connections(container_id, message)

                # Pequeno delay para não sobrecarregar
                await asyncio.sleep(0.01)

        except Exception as e:
            logger.error(f"❌ Erro no stream de logs para {container_id}: {e}")
        finally:
            logger.info(f"🔚 Stream de logs finalizado para container {container_id}")

    async def _stream_system_metrics(self):
        """Stream contínuo de métricas do sistema"""
        try:
            logger.info("📡 Iniciando stream de métricas do sistema")

            while self.system_metrics_connections:
                try:
                    # Coletar métricas do Docker
                    docker_info = await docker_service.get_system_info()

                    # Coletar estatísticas de containers ativos
                    containers = await docker_service.list_containers(
                        ContainerListRequest(all=False)
                    )

                    container_stats = []
                    for container in containers[:5]:  # Limite para performance
                        try:
                            stats = await docker_service.get_container_stats(container.id)
                            container_stats.append({
                                "id": container.id,
                                "name": container.name,
                                "cpu_usage": stats.cpu_usage,
                                "memory_usage": stats.memory_usage,
                                "memory_percent": stats.memory_percent
                            })
                        except:
                            continue

                    # Criar mensagem de métricas
                    message = {
                        "type": "system_metrics",
                        "timestamp": datetime.now().isoformat(),
                        "docker_info": {
                            "containers_running": docker_info.containers_running,
                            "containers_total": docker_info.containers,
                            "images": docker_info.images,
                            "volumes": docker_info.volumes,
                            "networks": docker_info.networks
                        },
                        "container_stats": container_stats
                    }

                    # Broadcast para todas as conexões de métricas
                    await self._broadcast_to_metrics_connections(message)

                except Exception as e:
                    logger.warning(f"⚠️ Erro ao coletar métricas: {e}")

                # Enviar métricas a cada 5 segundos
                await asyncio.sleep(5)

        except asyncio.CancelledError:
            logger.info("🔚 Stream de métricas cancelado")
        except Exception as e:
            logger.error(f"❌ Erro no stream de métricas: {e}")

    async def _stream_docker_events(self):
        """Stream contínuo de eventos do Docker"""
        try:
            logger.info("📡 Iniciando stream de eventos do Docker")

            # Stream de eventos do Docker
            events = docker_service.client.events(decode=True)

            for event in events:
                if not self.docker_events_connections:
                    break

                # Filtrar eventos interessantes
                if event.get('Type') in ['container', 'image', 'volume', 'network']:
                    message = {
                        "type": "docker_event",
                        "timestamp": datetime.now().isoformat(),
                        "event_type": event.get('Type'),
                        "action": event.get('Action'),
                        "actor": event.get('Actor', {}),
                        "time": event.get('time')
                    }

                    # Broadcast para todas as conexões de eventos
                    await self._broadcast_to_events_connections(message)

        except asyncio.CancelledError:
            logger.info("🔚 Stream de eventos do Docker cancelado")
        except Exception as e:
            logger.error(f"❌ Erro no stream de eventos: {e}")

    async def _broadcast_to_container_connections(self, container_id: str, message: Dict[str, Any]):
        """Envia mensagem para todas as conexões de um container específico"""
        if container_id not in self.docker_logs_connections:
            return

        disconnected = set()

        for websocket in self.docker_logs_connections[container_id].copy():
            try:
                await websocket.send_text(json.dumps(message))
            except (WebSocketDisconnect, ConnectionClosed):
                disconnected.add(websocket)
            except Exception as e:
                logger.warning(f"⚠️ Erro ao enviar mensagem WebSocket: {e}")
                disconnected.add(websocket)

        # Remover conexões desconectadas
        for websocket in disconnected:
            self.docker_logs_connections[container_id].discard(websocket)

    async def _broadcast_to_metrics_connections(self, message: Dict[str, Any]):
        """Envia mensagem para todas as conexões de métricas"""
        disconnected = set()

        for websocket in self.system_metrics_connections.copy():
            try:
                await websocket.send_text(json.dumps(message))
            except (WebSocketDisconnect, ConnectionClosed):
                disconnected.add(websocket)
            except Exception as e:
                logger.warning(f"⚠️ Erro ao enviar mensagem WebSocket: {e}")
                disconnected.add(websocket)

        # Remover conexões desconectadas
        for websocket in disconnected:
            self.system_metrics_connections.discard(websocket)

    async def _broadcast_to_events_connections(self, message: Dict[str, Any]):
        """Envia mensagem para todas as conexões de eventos"""
        disconnected = set()

        for websocket in self.docker_events_connections.copy():
            try:
                await websocket.send_text(json.dumps(message))
            except (WebSocketDisconnect, ConnectionClosed):
                disconnected.add(websocket)
            except Exception as e:
                logger.warning(f"⚠️ Erro ao enviar mensagem WebSocket: {e}")
                disconnected.add(websocket)

        # Remover conexões desconectadas
        for websocket in disconnected:
            self.docker_events_connections.discard(websocket)

    async def cleanup(self):
        """Limpa todas as conexões e tarefas ativas"""
        logger.info("🧹 Limpando conexões e tarefas WebSocket...")

        # Cancelar todas as tarefas de streaming
        for task in self.active_log_streams.values():
            task.cancel()

        if self.metrics_stream_task:
            self.metrics_stream_task.cancel()

        if self.docker_events_task:
            self.docker_events_task.cancel()

        # Limpar conexões
        self.docker_logs_connections.clear()
        self.system_metrics_connections.clear()
        self.docker_events_connections.clear()
        self.active_log_streams.clear()

        logger.info("✅ Limpeza de WebSocket concluída")

# Instância global do gerenciador de conexões
connection_manager = ConnectionManager()