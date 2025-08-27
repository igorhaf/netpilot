<?php

namespace App\Services;

use App\Models\Domain;

class TraefikService
{
    public function __construct(private SystemCommandService $cmd) {}

    public function applyDomain(Domain $domain, ?array $sslPaths = null): array
    {
        // Exemplo: atualizar arquivo dinâmico do Traefik e recarregar
        $configFile = "/etc/traefik/dynamic/{$domain->name}.yml";
        $yaml = sprintf("http:\n  routers:\n    %s-https:\n      rule: Host(`%s`)\n      entryPoints: [https]\n      service: %s-svc\n      tls:\n        certResolver: letsencrypt\n  services:\n    %s-svc:\n      loadBalancer:\n        servers:\n          - url: 'http://127.0.0.1:8080'\n", $domain->name, $domain->name, $domain->name, $domain->name);

        $commands = [];
        $commands[] = [
            'action' => 'traefik_write_dynamic',
            'cmd' => sprintf("bash -lc 'cat > %s <<EOF\n%s\nEOF'", $configFile, addslashes($yaml)),
        ];

        $commands[] = [
            'action' => 'traefik_reload',
            'cmd' => 'systemctl reload traefik',
        ];

        $results = [];
        foreach ($commands as $c) {
            $results[] = $this->cmd->execute('traefik', $c['action'], $c['cmd'], [
                'domain' => $domain->name,
            ]);
        }

        return $results;
    }

    /**
     * Deploy das configurações do Traefik
     */
    public function deployConfiguration(): array
    {
        try {
            // Recarregar Traefik
            $reloadResult = $this->cmd->execute('traefik', 'traefik_reload', 'systemctl reload traefik', [
                'action' => 'reload_traefik',
                'description' => 'Recarregando configurações do Traefik'
            ]);

            if (!$reloadResult['success']) {
                throw new \Exception('Falha ao recarregar Traefik: ' . ($reloadResult['stderr'] ?? $reloadResult['error'] ?? 'Erro desconhecido'));
            }

            return [
                'success' => true,
                'message' => 'Configurações do Traefik deployadas com sucesso',
                'reload_result' => $reloadResult
            ];

        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Erro ao fazer deploy das configurações do Traefik: ' . $e->getMessage(),
                'error' => $e->getMessage()
            ];
        }
    }
}
