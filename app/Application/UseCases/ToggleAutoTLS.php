<?php

namespace App\Application\UseCases;

use App\Models\Domain;
use App\Infra\Traefik\TraefikProvider;

class ToggleAutoTLS
{
    public function __invoke(Domain $domain, bool $enabled): Domain
    {
        $domain->update(['auto_tls' => $enabled]);

        // Re-sync domain configuration to update TLS settings
        if ($domain->is_active) {
            $this->syncDomainConfig($domain);
        }

        return $domain->fresh();
    }

    private function syncDomainConfig(Domain $domain): void
    {
        try {
            $provider = TraefikProvider::make();
            $provider->writeDomain($domain);
        } catch (\Exception $e) {
            \Log::warning('Failed to sync domain TLS configuration', [
                'domain_id' => $domain->id,
                'auto_tls' => $domain->auto_tls,
                'error' => $e->getMessage()
            ]);
        }
    }
}
