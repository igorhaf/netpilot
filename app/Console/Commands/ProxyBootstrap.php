<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Symfony\Component\Process\Process;

class ProxyBootstrap extends Command
{
    protected $signature = 'proxy:bootstrap';
    protected $description = 'Create proxy network, ensure acme.json perms, and bring up Traefik via Sail overlay';

    public function handle(): int
    {
        $projectRoot = base_path();
        $acmePath = base_path('docker/traefik/acme.json');

        if (!file_exists($acmePath)) {
            @touch($acmePath);
            $this->info('Created docker/traefik/acme.json');
        }

        @chmod($acmePath, 0600);

        // Compose overlay via COMPOSE_FILE so we can use plain `sail up -d traefik`
        $hostCmd = 'COMPOSE_FILE=docker-compose.yml:docker-compose.proxy.yml ./vendor/bin/sail up -d traefik';
        $this->line("Run (on host shell):\n  {$hostCmd}");

        // Best-effort auto-run when not in container
        if (is_executable(base_path('vendor/bin/sail')) && !$this->runningInContainer()) {
            $process = Process::fromShellCommandline('./vendor/bin/sail up -d traefik', $projectRoot, [
                'COMPOSE_FILE' => 'docker-compose.yml:docker-compose.proxy.yml',
            ], null, 300);
            $process->run(function ($type, $buffer) { echo $buffer; });
            if (!$process->isSuccessful()) {
                $this->warn('Failed to auto-run Sail. Use the printed command above.');
                return self::FAILURE;
            }
            $this->info('Traefik is up.');
        }

        return self::SUCCESS;
    }

    private function runningInContainer(): bool
    {
        return file_exists('/.dockerenv') || getenv('LARAVEL_SAIL');
    }
}

