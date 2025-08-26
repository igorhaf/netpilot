<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Symfony\Component\Process\Process;

class ProxyLogs extends Command
{
    protected $signature = 'proxy:logs {--follow : Follow (tail -f)}';
    protected $description = 'Tail Traefik logs via Sail overlay compose';

    public function handle(): int
    {
        $follow = $this->option('follow') ? ['-f'] : [];
        $cmd = array_merge([
            base_path('vendor/bin/sail'), 'docker', 'compose',
            '-f', 'docker-compose.yml',
            '-f', 'docker-compose.proxy.yml',
            'logs'
        ], $follow, ['traefik']);

        $process = new Process($cmd, base_path(), null, null, null);
        $process->setTimeout(null);
        $process->run(function ($type, $buffer) { echo $buffer; });

        return $process->isSuccessful() ? self::SUCCESS : self::FAILURE;
    }
}
