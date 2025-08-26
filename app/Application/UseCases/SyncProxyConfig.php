<?php

namespace App\Application\UseCases;

use App\Infra\Traefik\TraefikProvider;

class SyncProxyConfig
{
    public function __invoke(): array
    {
        $provider = TraefikProvider::make();
        return $provider->syncAll();
    }
}
