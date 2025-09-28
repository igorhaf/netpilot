"""
NetPilot System Operations - Nginx Service
Serviço para operações do Nginx
"""

import os
import subprocess
import logging
import shutil
import tempfile
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Any
from jinja2 import Environment, FileSystemLoader

from models.nginx import (
    NginxConfig, NginxSite, NginxStatus, NginxBackup,
    NginxReload, NginxTestConfig
)
from utils.system import SystemUtils
from utils.security import SecurityValidator
from utils.callbacks import CallbackManager

logger = logging.getLogger(__name__)


class NginxService:
    """Serviço para operações do Nginx"""

    def __init__(self):
        self.system_utils = SystemUtils()
        self.security = SecurityValidator()
        self.callback_manager = CallbackManager()

        # Caminhos do Nginx
        self.sites_available = os.getenv("NGINX_SITES_AVAILABLE", "/etc/nginx/sites-available")
        self.sites_enabled = os.getenv("NGINX_SITES_ENABLED", "/etc/nginx/sites-enabled")
        self.nginx_config = os.getenv("NGINX_CONFIG_PATH", "/etc/nginx/nginx.conf")
        self.backup_path = os.getenv("BACKUP_PATH", "/var/backups/netpilot")

        # Template engine
        self.template_env = Environment(
            loader=FileSystemLoader('templates'),
            autoescape=True
        )

    async def generate_config(self, config: NginxConfig) -> Dict[str, Any]:
        """Gerar configuração do Nginx"""
        try:
            logger.info(f"Gerando configuração Nginx para {config.site.server_name}")

            # Validar configuração
            self._validate_config(config)

            # Fazer backup se solicitado
            if config.backup_existing:
                await self._backup_existing_config(config.site.server_name)

            # Gerar configuração a partir do template
            config_content = self._render_template(config)

            # Escrever arquivo de configuração
            config_file = os.path.join(self.sites_available, f"{config.site.server_name}.conf")
            with open(config_file, 'w') as f:
                f.write(config_content)

            logger.info(f"Configuração criada: {config_file}")

            # Ativar site se solicitado
            if config.enabled:
                await self._enable_site(config.site.server_name)

            # Testar configuração
            test_result = await self.test_config()
            if not test_result.valid:
                # Reverter se configuração inválida
                await self._revert_config(config.site.server_name)
                raise Exception(f"Configuração inválida: {test_result.output}")

            # Callback se especificado
            if config.callback_url:
                await self.callback_manager.send_callback(
                    config.callback_url,
                    {
                        "operation": "nginx_config_generated",
                        "status": "success",
                        "site": config.site.server_name,
                        "config_file": config_file
                    }
                )

            return {
                "success": True,
                "message": f"Configuração gerada para {config.site.server_name}",
                "config_file": config_file,
                "test_result": test_result.dict()
            }

        except Exception as e:
            logger.error(f"Erro ao gerar configuração Nginx: {e}")

            # Callback de erro
            if config.callback_url:
                await self.callback_manager.send_callback(
                    config.callback_url,
                    {
                        "operation": "nginx_config_generated",
                        "status": "error",
                        "error": str(e)
                    }
                )

            raise

    async def reload_nginx(self, reload_config: NginxReload) -> Dict[str, Any]:
        """Recarregar Nginx"""
        try:
            logger.info("Recarregando Nginx")

            # Testar configuração se solicitado
            if reload_config.test_config:
                test_result = await self.test_config()
                if not test_result.valid:
                    raise Exception(f"Configuração inválida: {test_result.output}")

            # Comando de reload
            if reload_config.graceful:
                cmd = ["nginx", "-s", "reload"]
            else:
                cmd = ["systemctl", "restart", "nginx"]

            result = await self.system_utils.run_command(cmd)

            if result.returncode != 0:
                raise Exception(f"Falha no reload: {result.stderr}")

            # Callback
            if reload_config.callback_url:
                await self.callback_manager.send_callback(
                    reload_config.callback_url,
                    {
                        "operation": "nginx_reload",
                        "status": "success",
                        "graceful": reload_config.graceful
                    }
                )

            return {
                "success": True,
                "message": "Nginx recarregado com sucesso",
                "graceful": reload_config.graceful,
                "output": result.stdout
            }

        except Exception as e:
            logger.error(f"Erro ao recarregar Nginx: {e}")

            if reload_config.callback_url:
                await self.callback_manager.send_callback(
                    reload_config.callback_url,
                    {
                        "operation": "nginx_reload",
                        "status": "error",
                        "error": str(e)
                    }
                )

            raise

    async def test_config(self) -> NginxTestConfig:
        """Testar configuração do Nginx"""
        try:
            result = await self.system_utils.run_command(["nginx", "-t"])

            return NginxTestConfig(
                valid=result.returncode == 0,
                output=result.stdout + result.stderr,
                errors=[] if result.returncode == 0 else [result.stderr],
                warnings=[],
                file_tested=self.nginx_config
            )

        except Exception as e:
            logger.error(f"Erro ao testar configuração: {e}")
            return NginxTestConfig(
                valid=False,
                output=str(e),
                errors=[str(e)],
                warnings=[],
                file_tested=self.nginx_config
            )

    async def get_status(self) -> NginxStatus:
        """Obter status do Nginx"""
        try:
            # Status do serviço
            status_result = await self.system_utils.run_command(["systemctl", "status", "nginx"])
            running = status_result.returncode == 0

            # PID
            pid = None
            if running:
                try:
                    pid_result = await self.system_utils.run_command(["pgrep", "-f", "nginx: master"])
                    if pid_result.returncode == 0:
                        pid = int(pid_result.stdout.strip())
                except:
                    pass

            # Versão
            version_result = await self.system_utils.run_command(["nginx", "-v"])
            version = version_result.stderr.split("/")[-1].strip() if version_result.stderr else "unknown"

            # Teste de configuração
            test_result = await self.test_config()

            # Contar sites
            sites_available = len([f for f in os.listdir(self.sites_available) if f.endswith('.conf')])
            sites_enabled = len([f for f in os.listdir(self.sites_enabled) if os.path.islink(os.path.join(self.sites_enabled, f))])

            # Workers (estimativa)
            workers = 1
            try:
                worker_result = await self.system_utils.run_command(["pgrep", "-c", "nginx: worker"])
                if worker_result.returncode == 0:
                    workers = int(worker_result.stdout.strip())
            except:
                pass

            return NginxStatus(
                running=running,
                pid=pid,
                version=version,
                config_test=test_result.valid,
                sites_enabled=sites_enabled,
                sites_available=sites_available,
                workers=workers,
                connections={}  # TODO: Implementar estatísticas de conexão
            )

        except Exception as e:
            logger.error(f"Erro ao obter status do Nginx: {e}")
            raise

    async def backup_config(self, backup_config: NginxBackup) -> Dict[str, Any]:
        """Fazer backup das configurações do Nginx"""
        try:
            logger.info("Iniciando backup das configurações Nginx")

            # Criar diretório de backup
            backup_dir = Path(backup_config.backup_path)
            backup_dir.mkdir(parents=True, exist_ok=True)

            # Nome do backup com timestamp
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            backup_name = f"nginx_backup_{timestamp}"
            backup_file = backup_dir / f"{backup_name}.tar.gz"

            # Arquivos a fazer backup
            backup_paths = []

            if backup_config.include_configs:
                backup_paths.extend([
                    "/etc/nginx/nginx.conf",
                    "/etc/nginx/conf.d",
                    "/etc/nginx/snippets"
                ])

            if backup_config.include_sites:
                backup_paths.extend([
                    self.sites_available,
                    self.sites_enabled
                ])

            if backup_config.include_logs:
                log_path = os.getenv("NGINX_LOG_PATH", "/var/log/nginx")
                backup_paths.append(log_path)

            # Criar backup
            if backup_config.compression:
                cmd = ["tar", "-czf", str(backup_file)] + [p for p in backup_paths if os.path.exists(p)]
            else:
                backup_file = backup_dir / f"{backup_name}.tar"
                cmd = ["tar", "-cf", str(backup_file)] + [p for p in backup_paths if os.path.exists(p)]

            result = await self.system_utils.run_command(cmd)

            if result.returncode != 0:
                raise Exception(f"Falha no backup: {result.stderr}")

            # Limpar backups antigos
            if backup_config.retention_days > 0:
                await self._cleanup_old_backups(backup_dir, backup_config.retention_days)

            return {
                "success": True,
                "message": "Backup criado com sucesso",
                "backup_file": str(backup_file),
                "backup_size": os.path.getsize(backup_file),
                "paths_backed_up": backup_paths
            }

        except Exception as e:
            logger.error(f"Erro ao fazer backup: {e}")
            raise

    def _validate_config(self, config: NginxConfig):
        """Validar configuração do Nginx"""
        site = config.site

        # Validar server_name
        if not site.server_name:
            raise ValueError("server_name é obrigatório")

        # Validar domínios
        if not site.domains:
            raise ValueError("Pelo menos um domínio deve ser especificado")

        # Validar paths
        for location in site.locations:
            if location.root and not self.security.is_safe_path(location.root):
                raise ValueError(f"Path perigoso detectado: {location.root}")

        # Validar SSL se configurado
        if site.ssl:
            if not os.path.exists(site.ssl.certificate_path):
                raise ValueError(f"Certificado não encontrado: {site.ssl.certificate_path}")
            if not os.path.exists(site.ssl.certificate_key_path):
                raise ValueError(f"Chave privada não encontrada: {site.ssl.certificate_key_path}")

    def _render_template(self, config: NginxConfig) -> str:
        """Renderizar template do Nginx"""
        template = self.template_env.get_template(f"{config.template}.j2")

        return template.render(
            site=config.site,
            server_name=config.site.server_name,
            domains=" ".join(config.site.domains),
            listen_ports=config.site.listen_ports,
            locations=config.site.locations,
            upstreams=config.site.upstreams,
            ssl=config.site.ssl,
            force_https=config.site.force_https,
            access_log=config.site.access_log,
            error_log=config.site.error_log,
            custom_config=config.site.custom_config
        )

    async def _enable_site(self, server_name: str):
        """Ativar site criando symlink"""
        available_file = os.path.join(self.sites_available, f"{server_name}.conf")
        enabled_file = os.path.join(self.sites_enabled, f"{server_name}.conf")

        if not os.path.exists(available_file):
            raise Exception(f"Arquivo de configuração não encontrado: {available_file}")

        if os.path.exists(enabled_file):
            os.unlink(enabled_file)

        os.symlink(available_file, enabled_file)
        logger.info(f"Site ativado: {server_name}")

    async def _backup_existing_config(self, server_name: str):
        """Backup da configuração existente"""
        config_file = os.path.join(self.sites_available, f"{server_name}.conf")

        if os.path.exists(config_file):
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            backup_file = f"{config_file}.backup_{timestamp}"
            shutil.copy2(config_file, backup_file)
            logger.info(f"Backup criado: {backup_file}")

    async def _revert_config(self, server_name: str):
        """Reverter configuração em caso de erro"""
        config_file = os.path.join(self.sites_available, f"{server_name}.conf")

        # Procurar backup mais recente
        backup_files = [f for f in os.listdir(self.sites_available) if f.startswith(f"{server_name}.conf.backup_")]

        if backup_files:
            backup_files.sort(reverse=True)
            latest_backup = backup_files[0]
            backup_path = os.path.join(self.sites_available, latest_backup)

            shutil.copy2(backup_path, config_file)
            logger.info(f"Configuração revertida de: {backup_path}")
        else:
            # Remover arquivo se não há backup
            if os.path.exists(config_file):
                os.remove(config_file)
                logger.info(f"Arquivo removido: {config_file}")

    async def _cleanup_old_backups(self, backup_dir: Path, retention_days: int):
        """Limpar backups antigos"""
        cutoff_time = datetime.now().timestamp() - (retention_days * 24 * 3600)

        for backup_file in backup_dir.glob("nginx_backup_*.tar*"):
            if backup_file.stat().st_mtime < cutoff_time:
                backup_file.unlink()
                logger.info(f"Backup antigo removido: {backup_file}")