"""
Serviço de Monitoramento Avançado
Sistema completo para coleta de métricas, alertas e dashboards
"""

import asyncio
import logging
import psutil
import time
import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
from collections import defaultdict, deque

from models.monitoring import (
    SystemMetrics, NetworkMetrics, ProcessMetrics, ServiceMetrics,
    Alert, AlertRule, AlertSeverity, AlertStatus, HealthCheck,
    MonitoringStatus, MonitoringOverview, MetricSeries,
    MetricsRequest, AlertsRequest, MonitoringResponse
)
from services.docker_service import docker_service
from utils.callbacks import callback_manager

logger = logging.getLogger(__name__)

class MonitoringService:
    """Serviço principal de monitoramento"""

    def __init__(self):
        self.metrics_storage: Dict[str, deque] = defaultdict(lambda: deque(maxlen=1440))  # 24h com 1min
        self.active_alerts: Dict[str, Alert] = {}
        self.alert_rules: Dict[str, AlertRule] = {}
        self.health_checks: Dict[str, HealthCheck] = {}

        # Configurações
        self.collection_interval = 60  # segundos
        self.retention_hours = 24
        self.is_running = False

        # Tarefas assíncronas
        self.metrics_task: Optional[asyncio.Task] = None
        self.alerts_task: Optional[asyncio.Task] = None

        # Inicializar regras de alerta padrão
        self._setup_default_alert_rules()

    async def start_service(self):
        """Inicia o serviço de monitoramento"""
        try:
            logger.info("📊 Iniciando serviço de monitoramento...")

            self.is_running = True

            # Iniciar tarefas de coleta
            self.metrics_task = asyncio.create_task(self._metrics_collection_loop())
            self.alerts_task = asyncio.create_task(self._alert_evaluation_loop())

            logger.info("✅ Serviço de monitoramento iniciado")

        except Exception as e:
            logger.error(f"❌ Erro ao iniciar serviço de monitoramento: {e}")
            raise

    async def stop_service(self):
        """Para o serviço de monitoramento"""
        try:
            logger.info("📊 Parando serviço de monitoramento...")

            self.is_running = False

            # Cancelar tarefas
            if self.metrics_task:
                self.metrics_task.cancel()
            if self.alerts_task:
                self.alerts_task.cancel()

            logger.info("✅ Serviço de monitoramento parado")

        except Exception as e:
            logger.error(f"❌ Erro ao parar serviço de monitoramento: {e}")

    # ===========================
    # COLETA DE MÉTRICAS
    # ===========================

    async def _metrics_collection_loop(self):
        """Loop principal de coleta de métricas"""
        while self.is_running:
            try:
                # Coletar métricas do sistema
                await self._collect_system_metrics()
                await self._collect_network_metrics()
                await self._collect_process_metrics()
                await self._collect_docker_metrics()
                await self._collect_service_metrics()

                # Health checks
                await self._perform_health_checks()

                logger.debug("📈 Métricas coletadas com sucesso")

            except Exception as e:
                logger.error(f"❌ Erro na coleta de métricas: {e}")

            await asyncio.sleep(self.collection_interval)

    async def _collect_system_metrics(self):
        """Coleta métricas básicas do sistema"""
        try:
            # CPU
            cpu_percent = psutil.cpu_percent(interval=1)

            # Memória
            memory = psutil.virtual_memory()

            # Disco
            disk = psutil.disk_usage('/')

            # Load average
            load_avg = list(psutil.getloadavg()) if hasattr(psutil, 'getloadavg') else [0, 0, 0]

            # Uptime
            boot_time = psutil.boot_time()
            uptime = int(time.time() - boot_time)

            metrics = SystemMetrics(
                timestamp=datetime.now(),
                cpu_usage_percent=cpu_percent,
                memory_total=memory.total,
                memory_used=memory.used,
                memory_percent=memory.percent,
                disk_total=disk.total,
                disk_used=disk.used,
                disk_percent=(disk.used / disk.total) * 100,
                load_average=load_avg,
                uptime_seconds=uptime
            )

            # Armazenar métricas individuais
            timestamp = datetime.now()
            self._store_metric("system.cpu_percent", timestamp, cpu_percent)
            self._store_metric("system.memory_percent", timestamp, memory.percent)
            self._store_metric("system.disk_percent", timestamp, (disk.used / disk.total) * 100)
            self._store_metric("system.load_1m", timestamp, load_avg[0])

        except Exception as e:
            logger.error(f"❌ Erro ao coletar métricas do sistema: {e}")

    async def _collect_network_metrics(self):
        """Coleta métricas de rede"""
        try:
            net_io = psutil.net_io_counters(pernic=True)

            for interface, stats in net_io.items():
                if interface.startswith('lo'):  # Skip loopback
                    continue

                timestamp = datetime.now()
                self._store_metric(f"network.{interface}.bytes_sent", timestamp, stats.bytes_sent)
                self._store_metric(f"network.{interface}.bytes_recv", timestamp, stats.bytes_recv)
                self._store_metric(f"network.{interface}.packets_sent", timestamp, stats.packets_sent)
                self._store_metric(f"network.{interface}.packets_recv", timestamp, stats.packets_recv)

        except Exception as e:
            logger.error(f"❌ Erro ao coletar métricas de rede: {e}")

    async def _collect_process_metrics(self):
        """Coleta métricas de processos importantes"""
        try:
            # Processos que consomem mais CPU/memória
            processes = []
            for proc in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_percent']):
                try:
                    proc_info = proc.info
                    if proc_info['cpu_percent'] > 1.0 or proc_info['memory_percent'] > 1.0:
                        processes.append(proc)
                except (psutil.NoSuchProcess, psutil.AccessDenied):
                    continue

            # Top 10 processos por CPU
            top_cpu = sorted(processes, key=lambda x: x.info['cpu_percent'], reverse=True)[:10]

            for i, proc in enumerate(top_cpu):
                try:
                    info = proc.info
                    timestamp = datetime.now()
                    self._store_metric(f"process.top_cpu.{i}.cpu_percent", timestamp, info['cpu_percent'])
                    self._store_metric(f"process.top_cpu.{i}.memory_percent", timestamp, info['memory_percent'])
                except:
                    continue

        except Exception as e:
            logger.error(f"❌ Erro ao coletar métricas de processos: {e}")

    async def _collect_docker_metrics(self):
        """Coleta métricas do Docker"""
        try:
            # Status geral do Docker
            health = await docker_service.get_health_status()

            timestamp = datetime.now()
            self._store_metric("docker.containers_running", timestamp, health.containers_running)
            self._store_metric("docker.containers_total", timestamp, health.containers_total)
            self._store_metric("docker.images_total", timestamp, health.images_total)

            # Métricas de containers ativos
            try:
                from models.docker import ContainerListRequest
                containers = await docker_service.list_containers(ContainerListRequest(all=False))

                total_cpu = 0
                total_memory = 0

                for container in containers[:5]:  # Top 5 para performance
                    try:
                        stats = await docker_service.get_container_stats(container.id)
                        total_cpu += stats.cpu_usage
                        total_memory += stats.memory_percent

                        # Métricas por container
                        self._store_metric(f"docker.container.{container.name}.cpu_percent", timestamp, stats.cpu_usage)
                        self._store_metric(f"docker.container.{container.name}.memory_percent", timestamp, stats.memory_percent)

                    except:
                        continue

                self._store_metric("docker.total_cpu_usage", timestamp, total_cpu)
                self._store_metric("docker.total_memory_usage", timestamp, total_memory)

            except Exception as docker_error:
                logger.warning(f"⚠️ Erro ao coletar métricas detalhadas do Docker: {docker_error}")

        except Exception as e:
            logger.error(f"❌ Erro ao coletar métricas do Docker: {e}")

    async def _collect_service_metrics(self):
        """Coleta métricas de serviços específicos"""
        try:
            # Verificar serviços importantes
            services = ['nginx', 'docker', 'postgresql', 'redis-server']

            for service_name in services:
                try:
                    # Verificar se o processo está rodando
                    running = False
                    cpu_usage = 0
                    memory_usage = 0

                    for proc in psutil.process_iter(['name', 'cpu_percent', 'memory_percent']):
                        if service_name.lower() in proc.info['name'].lower():
                            running = True
                            cpu_usage = proc.info['cpu_percent']
                            memory_usage = proc.info['memory_percent']
                            break

                    timestamp = datetime.now()
                    self._store_metric(f"service.{service_name}.running", timestamp, 1 if running else 0)
                    if running:
                        self._store_metric(f"service.{service_name}.cpu_percent", timestamp, cpu_usage)
                        self._store_metric(f"service.{service_name}.memory_percent", timestamp, memory_usage)

                except Exception as service_error:
                    logger.debug(f"Erro ao verificar serviço {service_name}: {service_error}")

        except Exception as e:
            logger.error(f"❌ Erro ao coletar métricas de serviços: {e}")

    async def _perform_health_checks(self):
        """Executa health checks dos componentes"""
        try:
            checks = {}

            # Check do sistema
            cpu = psutil.cpu_percent()
            memory = psutil.virtual_memory().percent
            disk = psutil.disk_usage('/').percent if hasattr(psutil.disk_usage('/'), 'percent') else 0

            system_status = MonitoringStatus.HEALTHY
            if cpu > 90 or memory > 90 or disk > 90:
                system_status = MonitoringStatus.CRITICAL
            elif cpu > 70 or memory > 70 or disk > 80:
                system_status = MonitoringStatus.WARNING

            checks['system'] = HealthCheck(
                component='system',
                status=system_status,
                message=f"CPU: {cpu:.1f}%, Memory: {memory:.1f}%, Disk: {disk:.1f}%",
                timestamp=datetime.now(),
                response_time=0,
                details={'cpu': cpu, 'memory': memory, 'disk': disk}
            )

            # Check do Docker
            try:
                start_time = time.time()
                docker_health = await docker_service.get_health_status()
                response_time = (time.time() - start_time) * 1000

                docker_status = MonitoringStatus.HEALTHY if docker_health.status == "healthy" else MonitoringStatus.CRITICAL

                checks['docker'] = HealthCheck(
                    component='docker',
                    status=docker_status,
                    message=docker_health.message,
                    timestamp=datetime.now(),
                    response_time=response_time,
                    details={
                        'containers_running': docker_health.containers_running,
                        'containers_total': docker_health.containers_total,
                        'version': docker_health.docker_version
                    }
                )
            except Exception as docker_error:
                checks['docker'] = HealthCheck(
                    component='docker',
                    status=MonitoringStatus.CRITICAL,
                    message=f"Docker não acessível: {docker_error}",
                    timestamp=datetime.now(),
                    response_time=0,
                    details={}
                )

            self.health_checks = checks

        except Exception as e:
            logger.error(f"❌ Erro nos health checks: {e}")

    def _store_metric(self, metric_name: str, timestamp: datetime, value: float):
        """Armazena uma métrica na memória"""
        self.metrics_storage[metric_name].append((timestamp, value))

    # ===========================
    # SISTEMA DE ALERTAS
    # ===========================

    def _setup_default_alert_rules(self):
        """Configura regras de alerta padrão"""
        default_rules = [
            AlertRule(
                id="high_cpu",
                name="High CPU Usage",
                description="CPU usage above 80%",
                metric="system.cpu_percent",
                condition=">",
                threshold=80.0,
                severity=AlertSeverity.HIGH,
                duration=300  # 5 minutos
            ),
            AlertRule(
                id="high_memory",
                name="High Memory Usage",
                description="Memory usage above 85%",
                metric="system.memory_percent",
                condition=">",
                threshold=85.0,
                severity=AlertSeverity.HIGH,
                duration=300
            ),
            AlertRule(
                id="disk_full",
                name="Disk Space Critical",
                description="Disk usage above 90%",
                metric="system.disk_percent",
                condition=">",
                threshold=90.0,
                severity=AlertSeverity.CRITICAL,
                duration=60
            ),
            AlertRule(
                id="docker_down",
                name="Docker Service Down",
                description="Docker containers not running",
                metric="docker.containers_running",
                condition="==",
                threshold=0.0,
                severity=AlertSeverity.CRITICAL,
                duration=60
            )
        ]

        for rule in default_rules:
            self.alert_rules[rule.id] = rule

    async def _alert_evaluation_loop(self):
        """Loop de avaliação de alertas"""
        while self.is_running:
            try:
                await self._evaluate_alert_rules()
                await asyncio.sleep(30)  # Avaliar a cada 30 segundos
            except Exception as e:
                logger.error(f"❌ Erro na avaliação de alertas: {e}")

    async def _evaluate_alert_rules(self):
        """Avalia todas as regras de alerta"""
        for rule_id, rule in self.alert_rules.items():
            if not rule.enabled:
                continue

            try:
                await self._evaluate_single_rule(rule)
            except Exception as e:
                logger.error(f"❌ Erro ao avaliar regra {rule_id}: {e}")

    async def _evaluate_single_rule(self, rule: AlertRule):
        """Avalia uma regra de alerta específica"""
        # Obter valores recentes da métrica
        if rule.metric not in self.metrics_storage:
            return

        recent_values = list(self.metrics_storage[rule.metric])
        if not recent_values:
            return

        # Verificar se a condição é atendida
        current_value = recent_values[-1][1]  # Valor mais recente

        condition_met = False
        if rule.condition == ">":
            condition_met = current_value > rule.threshold
        elif rule.condition == "<":
            condition_met = current_value < rule.threshold
        elif rule.condition == "==":
            condition_met = current_value == rule.threshold
        elif rule.condition == ">=":
            condition_met = current_value >= rule.threshold
        elif rule.condition == "<=":
            condition_met = current_value <= rule.threshold

        alert_key = f"{rule.id}_{rule.metric}"

        if condition_met:
            # Verificar duração
            duration_met = True
            if rule.duration > 0:
                duration_met = self._check_alert_duration(rule, recent_values)

            if duration_met and alert_key not in self.active_alerts:
                # Criar novo alerta
                alert = Alert(
                    id=alert_key,
                    rule_id=rule.id,
                    rule_name=rule.name,
                    message=f"{rule.description} - Current: {current_value:.2f}, Threshold: {rule.threshold}",
                    severity=rule.severity,
                    status=AlertStatus.ACTIVE,
                    started_at=datetime.now(),
                    current_value=current_value,
                    threshold=rule.threshold,
                    labels=rule.labels
                )

                self.active_alerts[alert_key] = alert
                await self._send_alert_notification(alert)

                logger.warning(f"🚨 Novo alerta: {alert.message}")
        else:
            # Resolver alerta se existir
            if alert_key in self.active_alerts:
                alert = self.active_alerts[alert_key]
                alert.status = AlertStatus.RESOLVED
                alert.resolved_at = datetime.now()

                await self._send_alert_notification(alert)
                del self.active_alerts[alert_key]

                logger.info(f"✅ Alerta resolvido: {alert.message}")

    def _check_alert_duration(self, rule: AlertRule, values: List[Tuple[datetime, float]]) -> bool:
        """Verifica se a condição foi atendida pela duração necessária"""
        if len(values) < 2:
            return False

        cutoff_time = datetime.now() - timedelta(seconds=rule.duration)

        for timestamp, value in reversed(values):
            if timestamp < cutoff_time:
                break

            condition_met = False
            if rule.condition == ">":
                condition_met = value > rule.threshold
            elif rule.condition == "<":
                condition_met = value < rule.threshold
            elif rule.condition == "==":
                condition_met = value == rule.threshold
            elif rule.condition == ">=":
                condition_met = value >= rule.threshold
            elif rule.condition == "<=":
                condition_met = value <= rule.threshold

            if not condition_met:
                return False

        return True

    async def _send_alert_notification(self, alert: Alert):
        """Envia notificação de alerta"""
        try:
            # Callback para o NestJS
            callback_data = {
                "alert_id": alert.id,
                "rule_name": alert.rule_name,
                "message": alert.message,
                "severity": alert.severity.value,
                "status": alert.status.value,
                "current_value": alert.current_value,
                "threshold": alert.threshold,
                "started_at": alert.started_at.isoformat()
            }

            await callback_manager.send_callback(
                "/monitoring/alerts",
                callback_data
            )

        except Exception as e:
            logger.error(f"❌ Erro ao enviar notificação de alerta: {e}")

    # ===========================
    # API PÚBLICA
    # ===========================

    async def get_current_metrics(self) -> Dict[str, Any]:
        """Obtém métricas atuais do sistema"""
        current_metrics = {}

        for metric_name, values in self.metrics_storage.items():
            if values:
                current_metrics[metric_name] = {
                    "value": values[-1][1],
                    "timestamp": values[-1][0].isoformat()
                }

        return current_metrics

    async def get_metric_series(self, request: MetricsRequest) -> List[MetricSeries]:
        """Obtém séries temporais de métricas"""
        series = []

        end_time = request.end_time or datetime.now()
        start_time = request.start_time or (end_time - timedelta(hours=1))

        metrics_to_fetch = request.metrics or list(self.metrics_storage.keys())

        for metric_name in metrics_to_fetch:
            if metric_name in self.metrics_storage:
                values = []
                for timestamp, value in self.metrics_storage[metric_name]:
                    if start_time <= timestamp <= end_time:
                        values.append((timestamp, value))

                if values:
                    series.append(MetricSeries(
                        metric_name=metric_name,
                        labels=request.labels or {},
                        values=values
                    ))

        return series

    async def get_active_alerts(self, request: AlertsRequest = None) -> List[Alert]:
        """Obtém alertas ativos"""
        alerts = list(self.active_alerts.values())

        if request:
            if request.severity:
                alerts = [a for a in alerts if a.severity == request.severity]
            if request.status:
                alerts = [a for a in alerts if a.status == request.status]

        return alerts

    async def get_monitoring_overview(self) -> MonitoringOverview:
        """Obtém visão geral do monitoramento"""
        active_alerts = len([a for a in self.active_alerts.values() if a.status == AlertStatus.ACTIVE])
        critical_alerts = len([a for a in self.active_alerts.values()
                              if a.status == AlertStatus.ACTIVE and a.severity == AlertSeverity.CRITICAL])

        # Determinar status geral
        overall_status = MonitoringStatus.HEALTHY
        if critical_alerts > 0:
            overall_status = MonitoringStatus.CRITICAL
        elif active_alerts > 0:
            overall_status = MonitoringStatus.WARNING

        # Contar serviços
        services_up = len([h for h in self.health_checks.values() if h.status == MonitoringStatus.HEALTHY])
        services_down = len([h for h in self.health_checks.values() if h.status in [MonitoringStatus.CRITICAL, MonitoringStatus.WARNING]])

        return MonitoringOverview(
            system_status=overall_status,
            active_alerts=active_alerts,
            critical_alerts=critical_alerts,
            services_up=services_up,
            services_down=services_down,
            last_update=datetime.now(),
            components=list(self.health_checks.values())
        )

    async def add_alert_rule(self, rule: AlertRule) -> MonitoringResponse:
        """Adiciona nova regra de alerta"""
        try:
            self.alert_rules[rule.id] = rule

            return MonitoringResponse(
                success=True,
                message=f"Regra de alerta '{rule.name}' adicionada com sucesso",
                data={"rule_id": rule.id}
            )
        except Exception as e:
            return MonitoringResponse(
                success=False,
                message=f"Erro ao adicionar regra de alerta: {e}"
            )

    async def acknowledge_alert(self, alert_id: str) -> MonitoringResponse:
        """Confirma um alerta"""
        try:
            if alert_id in self.active_alerts:
                self.active_alerts[alert_id].status = AlertStatus.ACKNOWLEDGED
                self.active_alerts[alert_id].acknowledged_at = datetime.now()

                return MonitoringResponse(
                    success=True,
                    message=f"Alerta {alert_id} confirmado"
                )
            else:
                return MonitoringResponse(
                    success=False,
                    message=f"Alerta {alert_id} não encontrado"
                )
        except Exception as e:
            return MonitoringResponse(
                success=False,
                message=f"Erro ao confirmar alerta: {e}"
            )

# Instância global do serviço
monitoring_service = MonitoringService()