<?php

namespace App\Application\UseCases;

use App\Models\Domain;
use App\Infra\Traefik\TraefikProvider;

class CreateDomain
{
    public function __invoke(array $data): Domain
    {
        $domain = Domain::create([
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'auto_tls' => $data['auto_tls'] ?? false,
            'is_active' => $data['is_active'] ?? true,
        ]);

        // Auto-sync configuration if domain is active
        if ($domain->is_active) {
            $this->syncDomainConfig($domain);
        }

        return $domain;
    }

    private function syncDomainConfig(Domain $domain): void
    {
        try {
            $provider = TraefikProvider::make();
            $provider->writeDomain($domain);
        } catch (\Exception $e) {
            \Log::warning('Failed to sync domain configuration', [
                'domain_id' => $domain->id,
                'error' => $e->getMessage()
            ]);
        }
    }
}
