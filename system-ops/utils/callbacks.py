"""
NetPilot System Operations - Callback Manager
Gerenciador de callbacks para integração com NestJS
"""

import os
import logging
import json
import asyncio
from typing import Dict, Any, Optional
from datetime import datetime
import httpx

logger = logging.getLogger(__name__)


class CallbackManager:
    """Gerenciador de callbacks para notificar o NestJS"""

    def __init__(self):
        self.nestjs_api_url = os.getenv("NESTJS_API_URL", "http://localhost:3001")
        self.api_key = os.getenv("NESTJS_API_KEY", "")
        self.callback_token = os.getenv("CALLBACK_TOKEN", "netpilot-system-ops-callback-token")
        self.timeout = 30

    async def send_callback(self, callback_url: str, data: Dict[str, Any],
                          retry_count: int = 3) -> bool:
        """Enviar callback para URL especificada"""
        try:
            logger.info(f"Enviando callback para: {callback_url}")

            # Preparar dados do callback
            callback_data = {
                "timestamp": datetime.now().isoformat(),
                "source": "netpilot-system-ops",
                "callback_token": self.callback_token,
                "data": data
            }

            # Headers
            headers = {
                "Content-Type": "application/json",
                "User-Agent": "NetPilot-System-Operations/1.0",
                "X-Callback-Token": self.callback_token
            }

            if self.api_key:
                headers["Authorization"] = f"Bearer {self.api_key}"

            # Fazer requisição
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                for attempt in range(retry_count):
                    try:
                        response = await client.post(
                            callback_url,
                            json=callback_data,
                            headers=headers
                        )

                        if response.status_code in [200, 201, 202]:
                            logger.info(f"Callback enviado com sucesso: {response.status_code}")
                            return True
                        else:
                            logger.warning(f"Callback falhou com status {response.status_code}: {response.text}")

                    except httpx.TimeoutException:
                        logger.warning(f"Timeout no callback (tentativa {attempt + 1}/{retry_count})")
                    except httpx.RequestError as e:
                        logger.warning(f"Erro na requisição de callback (tentativa {attempt + 1}/{retry_count}): {e}")

                    if attempt < retry_count - 1:
                        await asyncio.sleep(2 ** attempt)  # Backoff exponencial

            logger.error(f"Falha ao enviar callback após {retry_count} tentativas")
            return False

        except Exception as e:
            logger.error(f"Erro ao enviar callback: {e}")
            return False

    async def notify_operation_started(self, operation: str, details: Dict[str, Any],
                                     callback_url: Optional[str] = None) -> bool:
        """Notificar início de operação"""
        if not callback_url:
            callback_url = f"{self.nestjs_api_url}/api/system-ops/callbacks/operation-started"

        data = {
            "event": "operation_started",
            "operation": operation,
            "details": details,
            "status": "in_progress"
        }

        return await self.send_callback(callback_url, data)

    async def notify_operation_completed(self, operation: str, result: Dict[str, Any],
                                       callback_url: Optional[str] = None) -> bool:
        """Notificar conclusão de operação"""
        if not callback_url:
            callback_url = f"{self.nestjs_api_url}/api/system-ops/callbacks/operation-completed"

        data = {
            "event": "operation_completed",
            "operation": operation,
            "result": result,
            "status": "completed"
        }

        return await self.send_callback(callback_url, data)

    async def notify_operation_failed(self, operation: str, error: str,
                                    details: Dict[str, Any] = None,
                                    callback_url: Optional[str] = None) -> bool:
        """Notificar falha de operação"""
        if not callback_url:
            callback_url = f"{self.nestjs_api_url}/api/system-ops/callbacks/operation-failed"

        data = {
            "event": "operation_failed",
            "operation": operation,
            "error": error,
            "details": details or {},
            "status": "failed"
        }

        return await self.send_callback(callback_url, data)

    async def notify_nginx_config_generated(self, site_name: str, config_path: str,
                                          callback_url: Optional[str] = None) -> bool:
        """Notificar geração de configuração Nginx"""
        data = {
            "event": "nginx_config_generated",
            "site_name": site_name,
            "config_path": config_path,
            "timestamp": datetime.now().isoformat()
        }

        return await self.send_callback(
            callback_url or f"{self.nestjs_api_url}/api/system-ops/callbacks/nginx-config",
            data
        )

    async def notify_ssl_certificate_generated(self, domains: list, cert_path: str,
                                             provider: str, callback_url: Optional[str] = None) -> bool:
        """Notificar geração de certificado SSL"""
        data = {
            "event": "ssl_certificate_generated",
            "domains": domains,
            "certificate_path": cert_path,
            "provider": provider,
            "timestamp": datetime.now().isoformat()
        }

        return await self.send_callback(
            callback_url or f"{self.nestjs_api_url}/api/system-ops/callbacks/ssl-certificate",
            data
        )

    async def notify_service_restarted(self, service_name: str, success: bool,
                                     details: Dict[str, Any] = None,
                                     callback_url: Optional[str] = None) -> bool:
        """Notificar restart de serviço"""
        data = {
            "event": "service_restarted",
            "service_name": service_name,
            "success": success,
            "details": details or {},
            "timestamp": datetime.now().isoformat()
        }

        return await self.send_callback(
            callback_url or f"{self.nestjs_api_url}/api/system-ops/callbacks/service-restart",
            data
        )

    async def notify_user_created(self, username: str, user_type: str,
                                callback_url: Optional[str] = None) -> bool:
        """Notificar criação de usuário"""
        data = {
            "event": "user_created",
            "username": username,
            "user_type": user_type,
            "timestamp": datetime.now().isoformat()
        }

        return await self.send_callback(
            callback_url or f"{self.nestjs_api_url}/api/system-ops/callbacks/user-created",
            data
        )

    async def notify_traffic_rule_applied(self, rule_name: str, action: str,
                                        details: Dict[str, Any] = None,
                                        callback_url: Optional[str] = None) -> bool:
        """Notificar aplicação de regra de tráfego"""
        data = {
            "event": "traffic_rule_applied",
            "rule_name": rule_name,
            "action": action,
            "details": details or {},
            "timestamp": datetime.now().isoformat()
        }

        return await self.send_callback(
            callback_url or f"{self.nestjs_api_url}/api/system-ops/callbacks/traffic-rule",
            data
        )

    async def notify_health_check(self, health_status: Dict[str, Any],
                                callback_url: Optional[str] = None) -> bool:
        """Notificar resultado de health check"""
        data = {
            "event": "health_check",
            "health_status": health_status,
            "timestamp": datetime.now().isoformat()
        }

        return await self.send_callback(
            callback_url or f"{self.nestjs_api_url}/api/system-ops/callbacks/health-check",
            data
        )

    async def notify_security_alert(self, alert_type: str, severity: str,
                                  details: Dict[str, Any],
                                  callback_url: Optional[str] = None) -> bool:
        """Notificar alerta de segurança"""
        data = {
            "event": "security_alert",
            "alert_type": alert_type,
            "severity": severity,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }

        return await self.send_callback(
            callback_url or f"{self.nestjs_api_url}/api/system-ops/callbacks/security-alert",
            data
        )

    async def register_webhooks(self) -> bool:
        """Registrar webhooks no NestJS backend"""
        try:
            webhook_config = {
                "service": "netpilot-system-ops",
                "endpoints": {
                    "operation_started": f"{self.nestjs_api_url}/api/system-ops/callbacks/operation-started",
                    "operation_completed": f"{self.nestjs_api_url}/api/system-ops/callbacks/operation-completed",
                    "operation_failed": f"{self.nestjs_api_url}/api/system-ops/callbacks/operation-failed",
                    "nginx_config": f"{self.nestjs_api_url}/api/system-ops/callbacks/nginx-config",
                    "ssl_certificate": f"{self.nestjs_api_url}/api/system-ops/callbacks/ssl-certificate",
                    "service_restart": f"{self.nestjs_api_url}/api/system-ops/callbacks/service-restart",
                    "user_created": f"{self.nestjs_api_url}/api/system-ops/callbacks/user-created",
                    "traffic_rule": f"{self.nestjs_api_url}/api/system-ops/callbacks/traffic-rule",
                    "health_check": f"{self.nestjs_api_url}/api/system-ops/callbacks/health-check",
                    "security_alert": f"{self.nestjs_api_url}/api/system-ops/callbacks/security-alert"
                },
                "callback_token": self.callback_token,
                "timestamp": datetime.now().isoformat()
            }

            headers = {
                "Content-Type": "application/json",
                "X-Callback-Token": self.callback_token
            }

            if self.api_key:
                headers["Authorization"] = f"Bearer {self.api_key}"

            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.nestjs_api_url}/api/system-ops/register-webhooks",
                    json=webhook_config,
                    headers=headers
                )

                if response.status_code in [200, 201]:
                    logger.info("Webhooks registrados com sucesso no NestJS")
                    return True
                else:
                    logger.warning(f"Falha ao registrar webhooks: {response.status_code}")
                    return False

        except Exception as e:
            logger.error(f"Erro ao registrar webhooks: {e}")
            return False

    def get_callback_url(self, endpoint: str) -> str:
        """Obter URL de callback para endpoint específico"""
        return f"{self.nestjs_api_url}/api/system-ops/callbacks/{endpoint}"

    async def test_callback_connectivity(self) -> bool:
        """Testar conectividade com o NestJS backend"""
        try:
            test_data = {
                "event": "connectivity_test",
                "timestamp": datetime.now().isoformat(),
                "service": "netpilot-system-ops"
            }

            callback_url = f"{self.nestjs_api_url}/api/system-ops/callbacks/test"

            return await self.send_callback(callback_url, test_data, retry_count=1)

        except Exception as e:
            logger.error(f"Erro no teste de conectividade: {e}")
            return False