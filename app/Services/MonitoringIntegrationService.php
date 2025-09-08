<?php

namespace App\Services;

class MonitoringIntegrationService
{
    public function __construct(
        private string $provider,
        private array $config
    ) {}

    public function sendMetrics(array $metrics): bool
    {
        // Implementation will vary by provider
        return true;
    }

    public function createAlert(string $name, array $conditions): bool
    {
        // Create alert in monitoring system
        return true;
    }
}
