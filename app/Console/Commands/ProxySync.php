<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Application\UseCases\SyncProxyConfig;

class ProxySync extends Command
{
    protected $signature = 'proxy:sync';
    protected $description = 'Render and write Traefik dynamic YAML from database';

    public function handle(SyncProxyConfig $useCase): int
    {
        $written = $useCase();
        foreach ($written as $f) {
            $this->line("wrote: $f");
        }
        $this->info('Proxy config synchronized.');
        return self::SUCCESS;
    }
}
