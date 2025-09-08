<?php

namespace App\Application\UseCases;

use App\Infra\Traefik\TraefikProvider;
use App\Events\SyncProgress;

class SyncProxyConfig
{
    public function __invoke(): array
    {
        $provider = TraefikProvider::make();
        
        // Broadcast sync start
        event(new SyncProgress('Starting sync...', 0, 'init'));
        
        // Simulate progress (in real app this would track actual steps)
        $steps = ['generating_config', 'validating', 'writing_files', 'reloading'];
        
        foreach ($steps as $i => $step) {
            event(new SyncProgress(
                'Processing: ' . str_replace('_', ' ', $step),
                (int)(($i + 1) / count($steps) * 100),
                $step
            ));
            
            // Simulate work
            sleep(1);
        }
        
        return $provider->syncAll();
    }
}
