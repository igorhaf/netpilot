"""
Configuration Generation Service
Gera configurações Nginx e Traefik a partir do banco de dados
"""
import os
import logging
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any
from jinja2 import Environment, FileSystemLoader, select_autoescape
from sqlalchemy.orm import Session

from database.models import Domain, ProxyRule
from database.connection import get_db

logger = logging.getLogger(__name__)


class ConfigGenerationService:
    """Serviço para geração de configurações Nginx e Traefik"""

    def __init__(self):
        # Paths
        self.nginx_config_path = os.getenv("NGINX_CONFIG_PATH", "/home/projects/netpilot/configs/nginx/sites")
        self.traefik_config_path = os.getenv("TRAEFIK_CONFIG_PATH", "/home/projects/netpilot/configs/traefik")

        # Ensure directories exist
        Path(self.nginx_config_path).mkdir(parents=True, exist_ok=True)
        Path(self.traefik_config_path).mkdir(parents=True, exist_ok=True)

        # Jinja2 environment
        template_path = Path(__file__).parent.parent / "templates"
        self.jinja_env = Environment(
            loader=FileSystemLoader(str(template_path)),
            autoescape=select_autoescape(['html', 'xml']),
            trim_blocks=True,
            lstrip_blocks=True
        )

    def get_active_domains(self, db: Session) -> List[Domain]:
        """Busca domínios ativos do banco de dados"""
        return db.query(Domain).filter(
            Domain.isActive == True
        ).all()

    def generate_nginx_config(self, db: Session = None) -> Dict[str, Any]:
        """Gera todas as configurações Nginx"""
        try:
            if db is None:
                db = next(get_db())

            logger.info("🔧 Gerando configurações Nginx...")

            domains = self.get_active_domains(db)
            generated_files = []

            for domain in domains:
                # Filtrar proxy rules ativas e ordenar por prioridade
                proxy_rules = [
                    rule for rule in domain.proxyRules
                    if rule.isActive
                ]
                proxy_rules.sort(key=lambda x: x.priority, reverse=True)

                # Renderizar template
                template = self.jinja_env.get_template('nginx/site.conf.j2')
                config_content = template.render(
                    domain=domain,
                    proxy_rules=proxy_rules,
                    generation_time=datetime.now().isoformat()
                )

                # Escrever arquivo
                config_file = Path(self.nginx_config_path) / f"{domain.name}.conf"
                config_file.write_text(config_content)

                generated_files.append(str(config_file))
                logger.info(f"✅ Configuração gerada: {domain.name}.conf")

            return {
                "success": True,
                "message": f"Configurações Nginx geradas para {len(domains)} domínios",
                "domains_count": len(domains),
                "files": generated_files
            }

        except Exception as e:
            logger.error(f"❌ Erro ao gerar configurações Nginx: {e}")
            raise

    def generate_traefik_config(self, db: Session = None) -> Dict[str, Any]:
        """Gera configuração dinâmica do Traefik"""
        try:
            if db is None:
                db = next(get_db())

            logger.info("🔧 Gerando configuração Traefik...")

            domains = self.get_active_domains(db)

            # Processar domínios e suas regras
            for domain in domains:
                # Filtrar proxy rules ativas e ordenar por prioridade
                proxy_rules = [
                    rule for rule in domain.proxyRules
                    if rule.isActive
                ]
                proxy_rules.sort(key=lambda x: x.priority, reverse=True)
                domain.proxyRules = proxy_rules

            # Renderizar template
            template = self.jinja_env.get_template('traefik/dynamic.yml.j2')
            config_content = template.render(
                domains=domains,
                generation_time=datetime.now().isoformat()
            )

            # Escrever arquivo
            config_file = Path(self.traefik_config_path) / "dynamic.yml"
            config_file.write_text(config_content)

            logger.info(f"✅ Configuração Traefik gerada: dynamic.yml")

            return {
                "success": True,
                "message": f"Configuração Traefik gerada para {len(domains)} domínios",
                "domains_count": len(domains),
                "file": str(config_file)
            }

        except Exception as e:
            logger.error(f"❌ Erro ao gerar configuração Traefik: {e}")
            raise

    def generate_all_configs(self, db: Session = None) -> Dict[str, Any]:
        """Gera todas as configurações (Nginx + Traefik)"""
        try:
            nginx_result = self.generate_nginx_config(db)
            traefik_result = self.generate_traefik_config(db)

            return {
                "success": True,
                "message": "Todas as configurações foram geradas com sucesso",
                "nginx": nginx_result,
                "traefik": traefik_result
            }

        except Exception as e:
            logger.error(f"❌ Erro ao gerar configurações: {e}")
            raise

    async def reload_nginx(self) -> Dict[str, Any]:
        """Recarrega Nginx (em produção)"""
        try:
            import subprocess

            # Testar configuração primeiro
            test_result = subprocess.run(
                ["nginx", "-t"],
                capture_output=True,
                text=True
            )

            if test_result.returncode != 0:
                return {
                    "success": False,
                    "message": "Configuração Nginx inválida",
                    "error": test_result.stderr
                }

            # Reload Nginx
            reload_result = subprocess.run(
                ["nginx", "-s", "reload"],
                capture_output=True,
                text=True
            )

            if reload_result.returncode != 0:
                return {
                    "success": False,
                    "message": "Falha ao recarregar Nginx",
                    "error": reload_result.stderr
                }

            logger.info("🔄 Nginx recarregado com sucesso")

            return {
                "success": True,
                "message": "Nginx recarregado com sucesso"
            }

        except Exception as e:
            logger.error(f"❌ Erro ao recarregar Nginx: {e}")
            return {
                "success": False,
                "message": f"Erro ao recarregar Nginx: {str(e)}"
            }
