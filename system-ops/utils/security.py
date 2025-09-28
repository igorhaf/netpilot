"""
NetPilot System Operations - Security Validator
Validações de segurança para operações do sistema
"""

import os
import re
import logging
from typing import List, Dict, Any, Optional, Set
from pathlib import Path

logger = logging.getLogger(__name__)


class SecurityValidator:
    """Validador de segurança para operações do sistema"""

    def __init__(self):
        # Comandos permitidos por padrão
        self.allowed_commands = self._load_allowed_commands()

        # Caminhos restritos
        self.restricted_paths = self._load_restricted_paths()

        # Padrões perigosos
        self.dangerous_patterns = [
            r'rm\s+-rf\s+/',
            r'dd\s+if=',
            r'mkfs',
            r'fdisk',
            r'format',
            r':\(\)\{\s*:\s*\|\s*:\s*&\s*\}\s*;:',  # Fork bomb
            r'wget.*\|\s*sh',
            r'curl.*\|\s*sh',
            r'chmod\s+777',
            r'chown\s+.*:.*\s+/',
            r'su\s+-',
            r'sudo\s+su',
            r'nc\s+.*-e',
            r'netcat\s+.*-e'
        ]

        # Extensões de arquivo perigosas
        self.dangerous_extensions = {
            '.sh', '.py', '.pl', '.rb', '.php', '.exe', '.bat', '.cmd'
        }

        # Serviços permitidos para restart
        self.safe_services = {
            'nginx', 'apache2', 'mysql', 'postgresql', 'redis-server',
            'ssh', 'sshd', 'ufw', 'fail2ban', 'docker', 'netpilot-backend',
            'netpilot-frontend', 'netpilot-system-ops'
        }

    def validate_command(self, command: str, allowed_commands: List[str] = None,
                        restricted_mode: bool = True) -> List[str]:
        """Validar comando para execução"""
        violations = []

        try:
            # Normalizar comando
            command_clean = command.strip().lower()

            if not command_clean:
                violations.append("Comando vazio")
                return violations

            # Verificar padrões perigosos
            for pattern in self.dangerous_patterns:
                if re.search(pattern, command_clean, re.IGNORECASE):
                    violations.append(f"Padrão perigoso detectado: {pattern}")

            # Extrair comando base
            command_parts = command_clean.split()
            if not command_parts:
                violations.append("Comando inválido")
                return violations

            base_command = command_parts[0]

            # Verificar se comando está na lista permitida
            if restricted_mode:
                allowed = allowed_commands or self.allowed_commands
                if base_command not in allowed:
                    violations.append(f"Comando não permitido: {base_command}")

            # Verificar tentativas de escape ou injection
            if self._has_command_injection(command):
                violations.append("Tentativa de injeção de comando detectada")

            # Verificar redirecionamentos perigosos
            if self._has_dangerous_redirects(command):
                violations.append("Redirecionamento perigoso detectado")

            # Verificar tentativas de escalação de privilégios
            if self._has_privilege_escalation(command):
                violations.append("Tentativa de escalação de privilégios detectada")

            return violations

        except Exception as e:
            logger.error(f"Erro ao validar comando: {e}")
            return ["Erro na validação do comando"]

    def is_safe_path(self, path: str) -> bool:
        """Verificar se caminho é seguro"""
        try:
            # Resolver caminho absoluto
            abs_path = os.path.abspath(path)

            # Verificar traversal de diretório
            if '..' in path or abs_path != os.path.normpath(abs_path):
                return False

            # Verificar caminhos restritos
            for restricted in self.restricted_paths:
                if abs_path.startswith(restricted):
                    logger.warning(f"Acesso negado ao caminho restrito: {abs_path}")
                    return False

            # Verificar se não é um device file
            if abs_path.startswith('/dev/'):
                return False

            # Verificar se não é um arquivo de sistema crítico
            critical_files = [
                '/etc/passwd', '/etc/shadow', '/etc/sudoers',
                '/etc/ssh/ssh_host_rsa_key', '/etc/ssl/private'
            ]

            for critical in critical_files:
                if abs_path.startswith(critical):
                    return False

            return True

        except Exception as e:
            logger.error(f"Erro ao validar caminho: {e}")
            return False

    def is_safe_service(self, service_name: str) -> bool:
        """Verificar se serviço é seguro para restart"""
        service_clean = service_name.strip().lower()

        # Verificar caracteres especiais
        if not re.match(r'^[a-z0-9\-_]+$', service_clean):
            return False

        # Verificar se está na lista de serviços seguros
        return service_clean in self.safe_services

    def validate_file_upload(self, filename: str, content: bytes = None) -> List[str]:
        """Validar upload de arquivo"""
        violations = []

        try:
            # Verificar nome do arquivo
            if not filename or filename.startswith('.'):
                violations.append("Nome de arquivo inválido")

            # Verificar extensão
            file_path = Path(filename)
            if file_path.suffix.lower() in self.dangerous_extensions:
                violations.append(f"Extensão de arquivo perigosa: {file_path.suffix}")

            # Verificar caracteres especiais no nome
            if re.search(r'[<>:"|?*]', filename):
                violations.append("Caracteres especiais no nome do arquivo")

            # Verificar conteúdo se fornecido
            if content:
                # Verificar por cabeçalhos executáveis
                if content.startswith(b'#!/'):
                    violations.append("Arquivo executável detectado")

                # Verificar por conteúdo suspeito
                content_str = content.decode('utf-8', errors='ignore').lower()

                suspicious_keywords = [
                    'eval(', 'exec(', 'system(', 'shell_exec(',
                    'passthru(', 'file_get_contents(',
                    'rm -rf', 'dd if=', 'mkfs'
                ]

                for keyword in suspicious_keywords:
                    if keyword in content_str:
                        violations.append(f"Conteúdo suspeito detectado: {keyword}")

            return violations

        except Exception as e:
            logger.error(f"Erro ao validar upload: {e}")
            return ["Erro na validação do arquivo"]

    def validate_ssl_certificate(self, cert_path: str) -> List[str]:
        """Validar certificado SSL"""
        violations = []

        try:
            if not os.path.exists(cert_path):
                violations.append("Certificado não encontrado")
                return violations

            # Verificar se é um arquivo PEM válido
            with open(cert_path, 'r') as f:
                content = f.read()

            if 'BEGIN CERTIFICATE' not in content:
                violations.append("Formato de certificado inválido")

            # Verificar permissões do arquivo
            import stat
            file_stat = os.stat(cert_path)
            file_mode = stat.S_IMODE(file_stat.st_mode)

            # Certificados não devem ser world-readable para chaves privadas
            if file_mode & stat.S_IROTH:
                violations.append("Permissões muito permissivas no certificado")

            return violations

        except Exception as e:
            logger.error(f"Erro ao validar certificado: {e}")
            return ["Erro na validação do certificado"]

    def validate_nginx_config(self, config_content: str) -> List[str]:
        """Validar configuração do Nginx"""
        violations = []

        try:
            # Verificar diretivas perigosas
            dangerous_directives = [
                'lua_code_cache off',
                'client_body_in_file_only on',
                'proxy_intercept_errors off'
            ]

            config_lower = config_content.lower()

            for directive in dangerous_directives:
                if directive in config_lower:
                    violations.append(f"Diretiva perigosa detectada: {directive}")

            # Verificar caminhos nos roots e alias
            root_pattern = r'(?:root|alias)\s+([^;]+);'
            for match in re.finditer(root_pattern, config_content, re.IGNORECASE):
                path = match.group(1).strip()
                if not self.is_safe_path(path):
                    violations.append(f"Caminho perigoso em root/alias: {path}")

            # Verificar proxy_pass para URLs externas suspeitas
            proxy_pattern = r'proxy_pass\s+(https?://[^;]+);'
            for match in re.finditer(proxy_pattern, config_content, re.IGNORECASE):
                url = match.group(1).strip()
                if self._is_suspicious_url(url):
                    violations.append(f"URL suspeita em proxy_pass: {url}")

            return violations

        except Exception as e:
            logger.error(f"Erro ao validar configuração Nginx: {e}")
            return ["Erro na validação da configuração"]

    def audit_log_action(self, action: str, user: str, details: Dict[str, Any]):
        """Registrar ação para auditoria"""
        try:
            audit_log_path = os.getenv("AUDIT_LOG_PATH", "/var/log/netpilot-audit.log")

            log_entry = {
                "timestamp": str(os.popen('date -Iseconds').read().strip()),
                "action": action,
                "user": user,
                "details": details,
                "source_ip": details.get("source_ip", "unknown")
            }

            with open(audit_log_path, 'a') as f:
                import json
                f.write(json.dumps(log_entry) + '\n')

        except Exception as e:
            logger.error(f"Erro ao registrar auditoria: {e}")

    def _load_allowed_commands(self) -> Set[str]:
        """Carregar comandos permitidos das configurações"""
        allowed_env = os.getenv("ALLOWED_COMMANDS", "")

        default_commands = {
            'ls', 'cat', 'grep', 'awk', 'sed', 'sort', 'uniq', 'head', 'tail',
            'ps', 'top', 'htop', 'df', 'du', 'free', 'uname', 'whoami', 'id',
            'systemctl', 'service', 'nginx', 'apache2ctl', 'mysql', 'psql',
            'docker', 'git', 'curl', 'wget', 'ping', 'nslookup', 'dig',
            'netstat', 'ss', 'iptables', 'ufw', 'fail2ban-client',
            'certbot', 'openssl', 'ssh', 'scp', 'rsync'
        }

        if allowed_env:
            env_commands = set(cmd.strip() for cmd in allowed_env.split(','))
            return default_commands.union(env_commands)

        return default_commands

    def _load_restricted_paths(self) -> List[str]:
        """Carregar caminhos restritos das configurações"""
        restricted_env = os.getenv("RESTRICTED_PATHS", "")

        default_restricted = [
            '/etc/passwd', '/etc/shadow', '/etc/sudoers', '/etc/ssh',
            '/root', '/var/lib/mysql', '/var/lib/postgresql',
            '/etc/ssl/private', '/etc/letsencrypt/archive'
        ]

        if restricted_env:
            env_paths = [path.strip() for path in restricted_env.split(',')]
            return default_restricted + env_paths

        return default_restricted

    def _has_command_injection(self, command: str) -> bool:
        """Verificar tentativas de injeção de comando"""
        injection_patterns = [
            r';\s*\w+',  # Command chaining
            r'\|\s*\w+',  # Piping to commands
            r'&&\s*\w+',  # AND chaining
            r'\|\|\s*\w+',  # OR chaining
            r'`[^`]*`',  # Backticks
            r'\$\([^)]*\)',  # Command substitution
            r'>\s*/etc/',  # Redirect to system files
            r'<\s*/etc/'  # Read from system files
        ]

        for pattern in injection_patterns:
            if re.search(pattern, command):
                return True

        return False

    def _has_dangerous_redirects(self, command: str) -> bool:
        """Verificar redirecionamentos perigosos"""
        dangerous_redirects = [
            r'>\s*/etc/',
            r'>\s*/usr/',
            r'>\s*/bin/',
            r'>\s*/sbin/',
            r'>\s*/dev/',
            r'>>\s*/etc/',
            r'<\s*/etc/passwd',
            r'<\s*/etc/shadow'
        ]

        for pattern in dangerous_redirects:
            if re.search(pattern, command, re.IGNORECASE):
                return True

        return False

    def _has_privilege_escalation(self, command: str) -> bool:
        """Verificar tentativas de escalação de privilégios"""
        escalation_patterns = [
            r'\bsu\s+',
            r'\bsudo\s+su',
            r'passwd\s+root',
            r'usermod.*root',
            r'chmod\s+\+s',
            r'chown\s+root:'
        ]

        for pattern in escalation_patterns:
            if re.search(pattern, command, re.IGNORECASE):
                return True

        return False

    def _is_suspicious_url(self, url: str) -> bool:
        """Verificar se URL é suspeita"""
        suspicious_domains = [
            'localhost', '127.0.0.1', '0.0.0.0',
            '192.168.', '10.', '172.16.', '172.17.',
            '172.18.', '172.19.', '172.20.', '172.21.',
            '172.22.', '172.23.', '172.24.', '172.25.',
            '172.26.', '172.27.', '172.28.', '172.29.',
            '172.30.', '172.31.'
        ]

        url_lower = url.lower()

        for domain in suspicious_domains:
            if domain in url_lower:
                return True

        return False