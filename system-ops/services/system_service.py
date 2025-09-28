"""
NetPilot System Operations - System Service
Serviço para operações gerais do sistema
"""

import os
import logging
import psutil
import subprocess
import asyncio
from datetime import datetime
from typing import Dict, List, Optional, Any

from models.system import (
    SystemHealth, SystemResources, ServiceStatus, ServiceRestart,
    SystemLogs, LogEntry, LogLevel, ServiceType, OperationResponse
)
from utils.system import SystemUtils
from utils.security import SecurityValidator
from utils.callbacks import CallbackManager

logger = logging.getLogger(__name__)


class SystemService:
    """Serviço para operações gerais do sistema"""

    def __init__(self):
        self.system_utils = SystemUtils()
        self.security = SecurityValidator()
        self.callback_manager = CallbackManager()

        # Thresholds de alerta
        self.cpu_threshold = float(os.getenv("SYSTEM_ALERT_THRESHOLD_CPU", 80))
        self.memory_threshold = float(os.getenv("SYSTEM_ALERT_THRESHOLD_MEMORY", 85))
        self.disk_threshold = float(os.getenv("SYSTEM_ALERT_THRESHOLD_DISK", 90))

    async def get_health(self) -> SystemHealth:
        """Obter health check completo do sistema"""
        try:
            logger.info("Executando health check do sistema")

            # Informações básicas
            hostname = os.uname().nodename
            uptime_seconds = psutil.boot_time()
            uptime = self._format_uptime(uptime_seconds)

            # Load average
            load_avg = list(os.getloadavg())

            # Recursos do sistema
            cpu_usage = psutil.cpu_percent(interval=1)
            memory = psutil.virtual_memory()
            memory_usage = memory.percent
            disk = psutil.disk_usage('/')
            disk_usage = disk.percent

            # Status dos serviços críticos
            services = await self._check_critical_services()
            critical_services_down = [name for name, status in services.items() if not status]

            # Interfaces de rede
            network_interfaces = self._get_network_interfaces()

            # Alertas
            alerts = []
            warnings = []

            if cpu_usage > self.cpu_threshold:
                alerts.append(f"Alto uso de CPU: {cpu_usage:.1f}%")

            if memory_usage > self.memory_threshold:
                alerts.append(f"Alto uso de memória: {memory_usage:.1f}%")

            if disk_usage > self.disk_threshold:
                alerts.append(f"Alto uso de disco: {disk_usage:.1f}%")

            if critical_services_down:
                alerts.append(f"Serviços críticos fora do ar: {', '.join(critical_services_down)}")

            if load_avg[0] > psutil.cpu_count():
                warnings.append(f"Load average alto: {load_avg[0]:.2f}")

            # Calcular health score
            health_score = self._calculate_health_score(
                cpu_usage, memory_usage, disk_usage, len(critical_services_down)
            )

            # Determinar status geral
            if health_score >= 90:
                status = "healthy"
            elif health_score >= 70:
                status = "warning"
            elif health_score >= 50:
                status = "degraded"
            else:
                status = "critical"

            return SystemHealth(
                status=status,
                hostname=hostname,
                uptime=uptime,
                load_average=load_avg,
                services=services,
                critical_services_down=critical_services_down,
                cpu_usage=cpu_usage,
                memory_usage=memory_usage,
                disk_usage=disk_usage,
                network_interfaces=network_interfaces,
                alerts=alerts,
                warnings=warnings,
                health_score=health_score
            )

        except Exception as e:
            logger.error(f"Erro ao obter health check: {e}")
            raise

    async def get_resources(self) -> SystemResources:
        """Obter recursos detalhados do sistema"""
        try:
            # CPU
            cpu_count = psutil.cpu_count()
            cpu_usage_per_core = psutil.cpu_percent(percpu=True, interval=1)
            cpu_freq = psutil.cpu_freq()
            cpu_frequency = {
                "current": cpu_freq.current if cpu_freq else 0,
                "min": cpu_freq.min if cpu_freq else 0,
                "max": cpu_freq.max if cpu_freq else 0
            }

            # Temperatura da CPU (se disponível)
            cpu_temperature = None
            try:
                temps = psutil.sensors_temperatures()
                if 'coretemp' in temps:
                    cpu_temperature = temps['coretemp'][0].current
            except:
                pass

            # Memória
            memory = psutil.virtual_memory()
            swap = psutil.swap_memory()

            # Disco
            disk_partitions = []
            for partition in psutil.disk_partitions():
                try:
                    usage = psutil.disk_usage(partition.mountpoint)
                    disk_partitions.append({
                        "device": partition.device,
                        "mountpoint": partition.mountpoint,
                        "fstype": partition.fstype,
                        "total": usage.total,
                        "used": usage.used,
                        "free": usage.free,
                        "percent": (usage.used / usage.total) * 100 if usage.total > 0 else 0
                    })
                except:
                    continue

            # I/O de disco
            disk_io = psutil.disk_io_counters()._asdict() if psutil.disk_io_counters() else {}

            # Rede
            network_interfaces = []
            net_interfaces = psutil.net_if_addrs()
            net_stats = psutil.net_if_stats()

            for interface, addrs in net_interfaces.items():
                interface_info = {
                    "name": interface,
                    "addresses": [{"family": addr.family.name, "address": addr.address} for addr in addrs],
                    "is_up": net_stats[interface].isup if interface in net_stats else False
                }
                network_interfaces.append(interface_info)

            # I/O de rede
            network_io = psutil.net_io_counters()._asdict() if psutil.net_io_counters() else {}

            # Processos
            processes = list(psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_percent']))
            process_count = len(processes)

            # Top processos por CPU e memória
            top_processes = sorted(processes, key=lambda p: p.info['cpu_percent'], reverse=True)[:10]
            top_processes_info = []

            for proc in top_processes:
                try:
                    top_processes_info.append({
                        "pid": proc.info['pid'],
                        "name": proc.info['name'],
                        "cpu_percent": proc.info['cpu_percent'],
                        "memory_percent": proc.info['memory_percent']
                    })
                except:
                    continue

            return SystemResources(
                cpu_count=cpu_count,
                cpu_usage_per_core=cpu_usage_per_core,
                cpu_frequency=cpu_frequency,
                cpu_temperature=cpu_temperature,
                memory_total=memory.total,
                memory_available=memory.available,
                memory_used=memory.used,
                memory_cached=memory.cached,
                swap_total=swap.total,
                swap_used=swap.used,
                disk_partitions=disk_partitions,
                disk_io=disk_io,
                network_interfaces=network_interfaces,
                network_io=network_io,
                process_count=process_count,
                top_processes=top_processes_info
            )

        except Exception as e:
            logger.error(f"Erro ao obter recursos do sistema: {e}")
            raise

    async def get_service_status(self, service_name: str) -> ServiceStatus:
        """Obter status de um serviço específico"""
        try:
            # Usar systemctl para obter informações detalhadas
            result = await self.system_utils.run_command([
                "systemctl", "show", service_name,
                "--property=LoadState,ActiveState,SubState,MainPID,ExecMainStartTimestamp"
            ])

            if result.returncode != 0:
                raise Exception(f"Serviço não encontrado: {service_name}")

            # Parsear output
            properties = {}
            for line in result.stdout.split('\n'):
                if '=' in line:
                    key, value = line.split('=', 1)
                    properties[key] = value

            # Status básico
            is_active_result = await self.system_utils.run_command(["systemctl", "is-active", service_name])
            running = is_active_result.returncode == 0

            is_enabled_result = await self.system_utils.run_command(["systemctl", "is-enabled", service_name])
            enabled = is_enabled_result.returncode == 0

            # PID e recursos se o serviço estiver rodando
            pid = None
            memory_usage = None
            cpu_usage = None
            uptime = None

            if running and properties.get('MainPID', '0') != '0':
                try:
                    pid = int(properties['MainPID'])
                    proc = psutil.Process(pid)
                    memory_usage = proc.memory_info().rss / 1024 / 1024  # MB
                    cpu_usage = proc.cpu_percent()

                    # Calcular uptime
                    start_time = properties.get('ExecMainStartTimestamp')
                    if start_time:
                        # TODO: Parsear timestamp e calcular uptime
                        pass

                except (psutil.NoSuchProcess, ValueError):
                    pass

            # Determinar tipo de serviço
            service_type = ServiceType.CUSTOM
            for stype in ServiceType:
                if stype.value in service_name.lower():
                    service_type = stype
                    break

            return ServiceStatus(
                name=service_name,
                type=service_type,
                running=running,
                enabled=enabled,
                pid=pid,
                uptime=uptime,
                memory_usage=memory_usage,
                cpu_usage=cpu_usage,
                status=properties.get('ActiveState', 'unknown'),
                sub_state=properties.get('SubState', 'unknown'),
                load_state=properties.get('LoadState', 'unknown'),
                active_state=properties.get('ActiveState', 'unknown')
            )

        except Exception as e:
            logger.error(f"Erro ao obter status do serviço {service_name}: {e}")
            raise

    async def restart_service(self, restart_config: ServiceRestart) -> OperationResponse:
        """Reiniciar um serviço"""
        try:
            logger.info(f"Reiniciando serviço: {restart_config.service_name}")

            # Validar se o serviço é seguro para reiniciar
            if not self.security.is_safe_service(restart_config.service_name):
                raise Exception(f"Serviço não permitido para restart: {restart_config.service_name}")

            # Comando de restart
            if restart_config.graceful:
                cmd = ["systemctl", "reload-or-restart", restart_config.service_name]
            else:
                cmd = ["systemctl", "restart", restart_config.service_name]

            result = await self.system_utils.run_command(cmd, timeout=restart_config.timeout)

            if result.returncode != 0:
                raise Exception(f"Falha ao reiniciar serviço: {result.stderr}")

            # Verificar se o serviço está rodando após o restart
            await asyncio.sleep(2)  # Aguardar um pouco
            status = await self.get_service_status(restart_config.service_name)

            # Callback
            if restart_config.callback_url:
                await self.callback_manager.send_callback(
                    restart_config.callback_url,
                    {
                        "operation": "service_restart",
                        "status": "success",
                        "service": restart_config.service_name,
                        "running": status.running
                    }
                )

            return OperationResponse(
                success=True,
                message=f"Serviço {restart_config.service_name} reiniciado com sucesso",
                data={
                    "service": restart_config.service_name,
                    "graceful": restart_config.graceful,
                    "running": status.running,
                    "pid": status.pid
                }
            )

        except Exception as e:
            logger.error(f"Erro ao reiniciar serviço: {e}")

            if restart_config.callback_url:
                await self.callback_manager.send_callback(
                    restart_config.callback_url,
                    {
                        "operation": "service_restart",
                        "status": "error",
                        "error": str(e)
                    }
                )

            raise

    async def get_logs(self, log_config: SystemLogs) -> List[LogEntry]:
        """Obter logs do sistema"""
        try:
            cmd = ["journalctl", "--output=json", "--no-pager"]

            # Filtros
            if log_config.service:
                cmd.extend(["-u", log_config.service])

            if log_config.lines:
                cmd.extend(["-n", str(log_config.lines)])

            if log_config.since:
                cmd.extend(["--since", log_config.since.isoformat()])

            if log_config.until:
                cmd.extend(["--until", log_config.until.isoformat()])

            if log_config.level:
                # Mapear níveis para journalctl
                level_map = {
                    LogLevel.DEBUG: "7",
                    LogLevel.INFO: "6",
                    LogLevel.WARNING: "4",
                    LogLevel.ERROR: "3",
                    LogLevel.CRITICAL: "2"
                }
                if log_config.level in level_map:
                    cmd.extend(["-p", level_map[log_config.level]])

            if log_config.grep:
                cmd.extend(["--grep", log_config.grep])

            if log_config.follow:
                cmd.append("-f")

            result = await self.system_utils.run_command(cmd)

            if result.returncode != 0:
                raise Exception(f"Falha ao obter logs: {result.stderr}")

            # Parsear logs JSON
            logs = []
            for line in result.stdout.split('\n'):
                if line.strip():
                    try:
                        import json
                        log_data = json.loads(line)

                        # Extrair informações
                        timestamp = datetime.fromtimestamp(int(log_data.get('__REALTIME_TIMESTAMP', 0)) / 1000000)
                        service = log_data.get('_SYSTEMD_UNIT', log_config.service or 'system')
                        message = log_data.get('MESSAGE', '')
                        hostname = log_data.get('_HOSTNAME', os.uname().nodename)
                        pid = log_data.get('_PID')

                        # Determinar nível
                        priority = int(log_data.get('PRIORITY', 6))
                        if priority <= 2:
                            level = LogLevel.CRITICAL
                        elif priority <= 3:
                            level = LogLevel.ERROR
                        elif priority <= 4:
                            level = LogLevel.WARNING
                        elif priority <= 6:
                            level = LogLevel.INFO
                        else:
                            level = LogLevel.DEBUG

                        logs.append(LogEntry(
                            timestamp=timestamp,
                            service=service,
                            level=level,
                            message=message,
                            hostname=hostname,
                            pid=int(pid) if pid else None,
                            unit=log_data.get('_SYSTEMD_UNIT')
                        ))

                    except (json.JSONDecodeError, ValueError):
                        continue

            return logs

        except Exception as e:
            logger.error(f"Erro ao obter logs: {e}")
            raise

    async def _check_critical_services(self) -> Dict[str, bool]:
        """Verificar status dos serviços críticos"""
        critical_services = [
            "nginx",
            "ssh",
            "systemd-resolved",
            "systemd-networkd"
        ]

        services_status = {}

        for service in critical_services:
            try:
                result = await self.system_utils.run_command(["systemctl", "is-active", service])
                services_status[service] = result.returncode == 0
            except:
                services_status[service] = False

        return services_status

    def _get_network_interfaces(self) -> Dict[str, Dict[str, Any]]:
        """Obter informações das interfaces de rede"""
        interfaces = {}

        try:
            net_interfaces = psutil.net_if_addrs()
            net_stats = psutil.net_if_stats()

            for interface, addrs in net_interfaces.items():
                interface_info = {
                    "addresses": [],
                    "is_up": False,
                    "speed": 0,
                    "mtu": 0
                }

                # Endereços
                for addr in addrs:
                    interface_info["addresses"].append({
                        "family": addr.family.name,
                        "address": addr.address,
                        "netmask": getattr(addr, 'netmask', None),
                        "broadcast": getattr(addr, 'broadcast', None)
                    })

                # Estatísticas
                if interface in net_stats:
                    stats = net_stats[interface]
                    interface_info.update({
                        "is_up": stats.isup,
                        "speed": stats.speed,
                        "mtu": stats.mtu
                    })

                interfaces[interface] = interface_info

        except Exception as e:
            logger.warning(f"Erro ao obter interfaces de rede: {e}")

        return interfaces

    def _calculate_health_score(self, cpu_usage: float, memory_usage: float,
                               disk_usage: float, critical_services_down: int) -> int:
        """Calcular score de saúde do sistema (0-100)"""
        score = 100

        # Penalizar por uso de recursos
        if cpu_usage > self.cpu_threshold:
            score -= min(30, (cpu_usage - self.cpu_threshold) * 2)

        if memory_usage > self.memory_threshold:
            score -= min(25, (memory_usage - self.memory_threshold) * 2)

        if disk_usage > self.disk_threshold:
            score -= min(20, (disk_usage - self.disk_threshold) * 2)

        # Penalizar por serviços críticos fora do ar
        score -= critical_services_down * 15

        return max(0, int(score))

    def _format_uptime(self, boot_time: float) -> str:
        """Formatar uptime em formato legível"""
        uptime_seconds = datetime.now().timestamp() - boot_time

        days = int(uptime_seconds // 86400)
        hours = int((uptime_seconds % 86400) // 3600)
        minutes = int((uptime_seconds % 3600) // 60)

        parts = []
        if days > 0:
            parts.append(f"{days} day{'s' if days != 1 else ''}")
        if hours > 0:
            parts.append(f"{hours} hour{'s' if hours != 1 else ''}")
        if minutes > 0:
            parts.append(f"{minutes} minute{'s' if minutes != 1 else ''}")

        return ", ".join(parts) if parts else "less than a minute"