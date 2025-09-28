"""
NetPilot System Operations - Traffic Service
Serviço para gerenciamento de tráfego e firewall
"""

import os
import logging
import subprocess
import asyncio
import ipaddress
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from collections import defaultdict

from models.system import TrafficRule, TrafficStats, TrafficAction
from utils.system import SystemUtils
from utils.security import SecurityValidator
from utils.callbacks import CallbackManager

logger = logging.getLogger(__name__)


class TrafficService:
    """Serviço para gerenciamento de tráfego e firewall"""

    def __init__(self):
        self.system_utils = SystemUtils()
        self.security = SecurityValidator()
        self.callback_manager = CallbackManager()

        # Cache de regras ativas
        self.active_rules: Dict[str, TrafficRule] = {}

        # Estatísticas de tráfego
        self.traffic_stats = {
            "connections": defaultdict(int),
            "blocked_ips": set(),
            "rate_limited_ips": set()
        }

    async def setup_traffic_rules(self, rules: List[TrafficRule]) -> Dict[str, Any]:
        """Configurar regras de tráfego"""
        try:
            logger.info(f"Configurando {len(rules)} regras de tráfego")

            results = []
            for rule in rules:
                try:
                    result = await self._apply_traffic_rule(rule)
                    results.append({
                        "rule_name": rule.name,
                        "success": result["success"],
                        "message": result.get("message", "")
                    })

                    if result["success"]:
                        # Armazenar regra ativa
                        rule_id = rule.rule_id or f"rule_{len(self.active_rules)}"
                        rule.rule_id = rule_id
                        self.active_rules[rule_id] = rule

                except Exception as e:
                    logger.error(f"Erro ao aplicar regra {rule.name}: {e}")
                    results.append({
                        "rule_name": rule.name,
                        "success": False,
                        "error": str(e)
                    })

            success_count = sum(1 for r in results if r["success"])

            return {
                "success": success_count > 0,
                "message": f"{success_count}/{len(rules)} regras aplicadas com sucesso",
                "results": results,
                "total_rules": len(rules),
                "successful_rules": success_count
            }

        except Exception as e:
            logger.error(f"Erro ao configurar regras de tráfego: {e}")
            raise

    async def block_ip(self, ip_address: str, duration_minutes: Optional[int] = None,
                      reason: str = "Manual block") -> Dict[str, Any]:
        """Bloquear endereço IP"""
        try:
            logger.info(f"Bloqueando IP: {ip_address}")

            # Validar IP
            try:
                ipaddress.ip_address(ip_address)
            except ValueError:
                raise Exception(f"Endereço IP inválido: {ip_address}")

            # Comando iptables para bloquear IP
            cmd = [
                "iptables", "-I", "INPUT", "-s", ip_address, "-j", "DROP"
            ]

            result = await self.system_utils.run_command(cmd)

            if result.returncode != 0:
                raise Exception(f"Falha ao bloquear IP: {result.stderr}")

            # Adicionar às estatísticas
            self.traffic_stats["blocked_ips"].add(ip_address)

            # Configurar desbloqueio automático se especificado
            if duration_minutes:
                asyncio.create_task(self._auto_unblock_ip(ip_address, duration_minutes))

            return {
                "success": True,
                "message": f"IP {ip_address} bloqueado com sucesso",
                "ip_address": ip_address,
                "duration_minutes": duration_minutes,
                "reason": reason,
                "blocked_at": datetime.now().isoformat()
            }

        except Exception as e:
            logger.error(f"Erro ao bloquear IP {ip_address}: {e}")
            raise

    async def setup_rate_limiting(self, ip_address: str, requests_per_minute: int,
                                 duration_minutes: Optional[int] = None) -> Dict[str, Any]:
        """Configurar rate limiting para IP"""
        try:
            logger.info(f"Configurando rate limiting para IP: {ip_address}")

            # Validar IP
            try:
                ipaddress.ip_address(ip_address)
            except ValueError:
                raise Exception(f"Endereço IP inválido: {ip_address}")

            # Comandos iptables para rate limiting
            # Criar chain personalizada se não existir
            await self._ensure_rate_limit_chain()

            # Regra de rate limiting
            cmd = [
                "iptables", "-I", "NETPILOT_RATE_LIMIT",
                "-s", ip_address,
                "-m", "limit",
                "--limit", f"{requests_per_minute}/min",
                "--limit-burst", str(requests_per_minute),
                "-j", "ACCEPT"
            ]

            result = await self.system_utils.run_command(cmd)

            if result.returncode != 0:
                raise Exception(f"Falha ao configurar rate limiting: {result.stderr}")

            # Regra para DROP se exceder limite
            cmd_drop = [
                "iptables", "-A", "NETPILOT_RATE_LIMIT",
                "-s", ip_address,
                "-j", "DROP"
            ]

            await self.system_utils.run_command(cmd_drop)

            # Adicionar às estatísticas
            self.traffic_stats["rate_limited_ips"].add(ip_address)

            # Configurar remoção automática se especificado
            if duration_minutes:
                asyncio.create_task(self._auto_remove_rate_limit(ip_address, duration_minutes))

            return {
                "success": True,
                "message": f"Rate limiting configurado para IP {ip_address}",
                "ip_address": ip_address,
                "requests_per_minute": requests_per_minute,
                "duration_minutes": duration_minutes,
                "configured_at": datetime.now().isoformat()
            }

        except Exception as e:
            logger.error(f"Erro ao configurar rate limiting para IP {ip_address}: {e}")
            raise

    async def get_traffic_stats(self) -> TrafficStats:
        """Obter estatísticas de tráfego"""
        try:
            # Obter estatísticas de conexões ativas
            netstat_result = await self.system_utils.run_command([
                "netstat", "-tuln"
            ])

            # Parsear conexões
            active_connections = 0
            if netstat_result.returncode == 0:
                lines = netstat_result.stdout.split('\n')
                active_connections = len([line for line in lines if 'ESTABLISHED' in line])

            # Obter estatísticas de interface de rede
            try:
                import psutil
                net_io = psutil.net_io_counters()
                bytes_in = net_io.bytes_recv
                bytes_out = net_io.bytes_sent

                # Calcular largura de banda (estimativa simplificada)
                bandwidth_in_mbps = (bytes_in / 1024 / 1024) / 60  # MB/min convertido para estimativa
                bandwidth_out_mbps = (bytes_out / 1024 / 1024) / 60

            except:
                bytes_in = bytes_out = 0
                bandwidth_in_mbps = bandwidth_out_mbps = 0

            # Top IPs de origem (simulado - em produção usar netstat/ss)
            top_source_ips = [
                {"ip": "192.168.1.100", "connections": 45, "bytes": 1024000},
                {"ip": "10.0.0.50", "connections": 32, "bytes": 756000},
                {"ip": "172.16.0.10", "connections": 28, "bytes": 634000}
            ]

            # Top portas de destino
            top_destination_ports = [
                {"port": 80, "connections": 150, "protocol": "tcp"},
                {"port": 443, "connections": 120, "protocol": "tcp"},
                {"port": 22, "connections": 25, "protocol": "tcp"}
            ]

            return TrafficStats(
                total_connections=active_connections + 200,  # Simulado
                active_connections=active_connections,
                connections_per_second=5.2,  # Simulado
                bytes_in=bytes_in,
                bytes_out=bytes_out,
                bandwidth_in_mbps=bandwidth_in_mbps,
                bandwidth_out_mbps=bandwidth_out_mbps,
                top_source_ips=top_source_ips,
                top_destination_ports=top_destination_ports,
                blocked_requests=len(self.traffic_stats["blocked_ips"]) * 10,  # Estimativa
                rate_limited_requests=len(self.traffic_stats["rate_limited_ips"]) * 5
            )

        except Exception as e:
            logger.error(f"Erro ao obter estatísticas de tráfego: {e}")
            raise

    async def list_active_rules(self) -> List[TrafficRule]:
        """Listar regras de tráfego ativas"""
        try:
            return list(self.active_rules.values())

        except Exception as e:
            logger.error(f"Erro ao listar regras ativas: {e}")
            raise

    async def remove_rule(self, rule_id: str) -> Dict[str, Any]:
        """Remover regra de tráfego"""
        try:
            if rule_id not in self.active_rules:
                raise Exception(f"Regra não encontrada: {rule_id}")

            rule = self.active_rules[rule_id]

            # Remover regra baseado no tipo
            if rule.action == TrafficAction.BLOCK:
                await self._remove_block_rule(rule)
            elif rule.action == TrafficAction.RATE_LIMIT:
                await self._remove_rate_limit_rule(rule)
            elif rule.action == TrafficAction.ALLOW:
                await self._remove_allow_rule(rule)

            # Remover da lista de regras ativas
            del self.active_rules[rule_id]

            return {
                "success": True,
                "message": f"Regra {rule.name} removida com sucesso",
                "rule_id": rule_id
            }

        except Exception as e:
            logger.error(f"Erro ao remover regra {rule_id}: {e}")
            raise

    async def _apply_traffic_rule(self, rule: TrafficRule) -> Dict[str, Any]:
        """Aplicar regra específica de tráfego"""
        if rule.action == TrafficAction.ALLOW:
            return await self._apply_allow_rule(rule)
        elif rule.action == TrafficAction.DENY or rule.action == TrafficAction.BLOCK:
            return await self._apply_block_rule(rule)
        elif rule.action == TrafficAction.RATE_LIMIT:
            return await self._apply_rate_limit_rule(rule)
        elif rule.action == TrafficAction.REDIRECT:
            return await self._apply_redirect_rule(rule)
        else:
            raise Exception(f"Ação não suportada: {rule.action}")

    async def _apply_allow_rule(self, rule: TrafficRule) -> Dict[str, Any]:
        """Aplicar regra de permissão"""
        cmd = ["iptables", "-I", "INPUT"]

        if rule.source_ip:
            cmd.extend(["-s", rule.source_ip])

        if rule.destination_port:
            cmd.extend(["-p", rule.protocol, "--dport", str(rule.destination_port)])

        cmd.extend(["-j", "ACCEPT"])

        result = await self.system_utils.run_command(cmd)

        return {
            "success": result.returncode == 0,
            "message": "Regra de permissão aplicada" if result.returncode == 0 else result.stderr
        }

    async def _apply_block_rule(self, rule: TrafficRule) -> Dict[str, Any]:
        """Aplicar regra de bloqueio"""
        cmd = ["iptables", "-I", "INPUT"]

        if rule.source_ip:
            cmd.extend(["-s", rule.source_ip])

        if rule.destination_port:
            cmd.extend(["-p", rule.protocol, "--dport", str(rule.destination_port)])

        cmd.extend(["-j", "DROP"])

        result = await self.system_utils.run_command(cmd)

        return {
            "success": result.returncode == 0,
            "message": "Regra de bloqueio aplicada" if result.returncode == 0 else result.stderr
        }

    async def _apply_rate_limit_rule(self, rule: TrafficRule) -> Dict[str, Any]:
        """Aplicar regra de rate limiting"""
        if not rule.rate_limit:
            raise Exception("Configuração de rate limiting não fornecida")

        await self._ensure_rate_limit_chain()

        # Extrair configurações de rate limiting
        rate_config = rule.rate_limit
        limit = rate_config.get("requests_per_minute", 60)
        burst = rate_config.get("burst", limit)

        cmd = ["iptables", "-I", "NETPILOT_RATE_LIMIT"]

        if rule.source_ip:
            cmd.extend(["-s", rule.source_ip])

        if rule.destination_port:
            cmd.extend(["-p", rule.protocol, "--dport", str(rule.destination_port)])

        cmd.extend([
            "-m", "limit",
            "--limit", f"{limit}/min",
            "--limit-burst", str(burst),
            "-j", "ACCEPT"
        ])

        result = await self.system_utils.run_command(cmd)

        return {
            "success": result.returncode == 0,
            "message": "Regra de rate limiting aplicada" if result.returncode == 0 else result.stderr
        }

    async def _apply_redirect_rule(self, rule: TrafficRule) -> Dict[str, Any]:
        """Aplicar regra de redirecionamento"""
        if not rule.redirect_to:
            raise Exception("Destino de redirecionamento não fornecido")

        # Para redirecionamentos, usar DNAT
        cmd = ["iptables", "-t", "nat", "-I", "PREROUTING"]

        if rule.source_ip:
            cmd.extend(["-s", rule.source_ip])

        if rule.destination_port:
            cmd.extend(["-p", rule.protocol, "--dport", str(rule.destination_port)])

        cmd.extend(["-j", "DNAT", "--to-destination", rule.redirect_to])

        result = await self.system_utils.run_command(cmd)

        return {
            "success": result.returncode == 0,
            "message": "Regra de redirecionamento aplicada" if result.returncode == 0 else result.stderr
        }

    async def _ensure_rate_limit_chain(self):
        """Garantir que a chain de rate limiting existe"""
        # Verificar se chain existe
        check_cmd = ["iptables", "-L", "NETPILOT_RATE_LIMIT", "-n"]
        result = await self.system_utils.run_command(check_cmd)

        if result.returncode != 0:
            # Criar chain
            create_cmd = ["iptables", "-N", "NETPILOT_RATE_LIMIT"]
            await self.system_utils.run_command(create_cmd)

            # Adicionar jump para a chain
            jump_cmd = ["iptables", "-I", "INPUT", "-j", "NETPILOT_RATE_LIMIT"]
            await self.system_utils.run_command(jump_cmd)

    async def _remove_block_rule(self, rule: TrafficRule):
        """Remover regra de bloqueio"""
        cmd = ["iptables", "-D", "INPUT"]

        if rule.source_ip:
            cmd.extend(["-s", rule.source_ip])

        if rule.destination_port:
            cmd.extend(["-p", rule.protocol, "--dport", str(rule.destination_port)])

        cmd.extend(["-j", "DROP"])

        await self.system_utils.run_command(cmd)

    async def _remove_rate_limit_rule(self, rule: TrafficRule):
        """Remover regra de rate limiting"""
        # Remover da chain de rate limiting
        if rule.rate_limit:
            limit = rule.rate_limit.get("requests_per_minute", 60)
            burst = rule.rate_limit.get("burst", limit)

            cmd = ["iptables", "-D", "NETPILOT_RATE_LIMIT"]

            if rule.source_ip:
                cmd.extend(["-s", rule.source_ip])

            if rule.destination_port:
                cmd.extend(["-p", rule.protocol, "--dport", str(rule.destination_port)])

            cmd.extend([
                "-m", "limit",
                "--limit", f"{limit}/min",
                "--limit-burst", str(burst),
                "-j", "ACCEPT"
            ])

            await self.system_utils.run_command(cmd)

    async def _remove_allow_rule(self, rule: TrafficRule):
        """Remover regra de permissão"""
        cmd = ["iptables", "-D", "INPUT"]

        if rule.source_ip:
            cmd.extend(["-s", rule.source_ip])

        if rule.destination_port:
            cmd.extend(["-p", rule.protocol, "--dport", str(rule.destination_port)])

        cmd.extend(["-j", "ACCEPT"])

        await self.system_utils.run_command(cmd)

    async def _auto_unblock_ip(self, ip_address: str, duration_minutes: int):
        """Desbloquear IP automaticamente após duração especificada"""
        await asyncio.sleep(duration_minutes * 60)

        try:
            # Remover regra de bloqueio
            cmd = ["iptables", "-D", "INPUT", "-s", ip_address, "-j", "DROP"]
            await self.system_utils.run_command(cmd)

            # Remover das estatísticas
            self.traffic_stats["blocked_ips"].discard(ip_address)

            logger.info(f"IP {ip_address} desbloqueado automaticamente")

        except Exception as e:
            logger.error(f"Erro ao desbloquear IP {ip_address}: {e}")

    async def _auto_remove_rate_limit(self, ip_address: str, duration_minutes: int):
        """Remover rate limiting automaticamente após duração especificada"""
        await asyncio.sleep(duration_minutes * 60)

        try:
            # Remover regras de rate limiting para este IP
            # (Implementação simplificada - remover todas as regras do IP)
            cmd = ["iptables", "-D", "NETPILOT_RATE_LIMIT", "-s", ip_address, "-j", "ACCEPT"]
            await self.system_utils.run_command(cmd)

            cmd_drop = ["iptables", "-D", "NETPILOT_RATE_LIMIT", "-s", ip_address, "-j", "DROP"]
            await self.system_utils.run_command(cmd_drop)

            # Remover das estatísticas
            self.traffic_stats["rate_limited_ips"].discard(ip_address)

            logger.info(f"Rate limiting removido para IP {ip_address}")

        except Exception as e:
            logger.error(f"Erro ao remover rate limiting para IP {ip_address}: {e}")