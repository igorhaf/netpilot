<?php

namespace App\Services;

use App\Models\Domain;

class NginxService
{
    public function __construct(private SystemCommandService $cmd) {}

    public function applyDomain(Domain $domain, ?array $sslPaths = null): array
    {
        // Exemplo de comandos; ajuste conforme sua infra real
        $configPath = "/etc/nginx/sites-available/{$domain->name}";
        $enabledPath = "/etc/nginx/sites-enabled/{$domain->name}";

        $commands = [];
        $commands[] = [
            'action' => 'nginx_write_config',
            'cmd' => sprintf('bash -lc "cat > %s <<EOF
server {\n    listen 80;\n    server_name %s;\n    return 301 https://$server_name$request_uri;\n}\n\nserver {\n    listen 443 ssl http2;\n    server_name %s;\n    ssl_certificate %s;\n    ssl_certificate_key %s;\n    ssl_trusted_certificate %s;\n    location / { return 200 \"OK\"; add_header Content-Type text/plain; }\n}\nEOF"',
                $configPath,
                $domain->name,
                $domain->name,
                $sslPaths['cert_path'] ?? '/etc/ssl/certs/placeholder.pem',
                $sslPaths['key_path'] ?? '/etc/ssl/private/placeholder.key',
                $sslPaths['chain_path'] ?? ($sslPaths['fullchain_path'] ?? '/etc/ssl/certs/placeholder-chain.pem')
            ),
        ];

        $commands[] = [
            'action' => 'nginx_enable_site',
            'cmd' => sprintf('ln -sf %s %s', $configPath, $enabledPath),
        ];

        $commands[] = [
            'action' => 'nginx_test',
            'cmd' => 'nginx -t',
        ];

        $commands[] = [
            'action' => 'nginx_reload',
            'cmd' => 'systemctl reload nginx',
        ];

        $results = [];
        foreach ($commands as $c) {
            $results[] = $this->cmd->execute('nginx', $c['action'], $c['cmd'], [
                'domain' => $domain->name,
            ]);
        }

        return $results;
    }
}
