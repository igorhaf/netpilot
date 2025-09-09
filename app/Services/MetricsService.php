<?php

namespace App\Services;

use App\Models\AnalyticsData;
use App\Services\AlertingService;
use Prometheus\CollectorRegistry;

class MetricsService
{
    public function __construct(
        private CollectorRegistry $registry,
        private AlertingService $alerts
    ) {}

    public function incrementRequestCount(string $route): void
    {
        $this->registry->getOrRegisterCounter(
            'netpilot',
            'http_requests_total',
            'Total HTTP requests',
            ['route']
        )->inc([$route]);
    }

    public function observeResponseTime(string $route, float $duration): void
    {
        $this->registry->getOrRegisterHistogram(
            'netpilot',
            'http_response_time_seconds',
            'HTTP response times',
            ['route'],
            [0.1, 0.5, 1, 2.5, 5, 10]
        )->observe($duration, [$route]);
    }

    public function setUpstreamStatus(int $upstreamId, bool $isHealthy): void
    {
        $this->registry->getOrRegisterGauge(
            'netpilot',
            'upstream_status',
            'Upstream health status (1 = healthy, 0 = unhealthy)',
            ['upstream_id']
        )->set($isHealthy ? 1 : 0, [$upstreamId]);
    }

    public function setSslCertificateStatus(int $certId, bool $isValid): void
    {
        $this->registry->getOrRegisterGauge(
            'netpilot',
            'ssl_certificate_status',
            'SSL certificate validity (1 = valid, 0 = invalid)',
            ['certificate_id']
        )->set($isValid ? 1 : 0, [$certId]);
    }

    public function checkForAnomalies(): void
    {
        // Check error rates
        $errorRate = $this->calculateErrorRate();
        if ($errorRate > 0.05) {
            $this->alerts->trigger('high_error_rate', [
                'rate' => $errorRate,
                'threshold' => 0.05
            ]);
        }

        // Check response times
        $slowResponses = $this->countSlowResponses();
        if ($slowResponses > 10) {
            $this->alerts->trigger('slow_responses', [
                'count' => $slowResponses
            ]);
        }
    }

    private function calculateErrorRate(): float
    {
        $errors = AnalyticsData::where('type', 'request')
            ->where('status_code', '>=', 500)
            ->where('created_at', '>', now()->subHour())
            ->count();
            
        $total = AnalyticsData::where('type', 'request')
            ->where('created_at', '>', now()->subHour())
            ->count();
            
        return $total > 0 ? $errors / $total : 0;
    }

    private function countSlowResponses(): int
    {
        return AnalyticsData::where('type', 'request')
            ->where('duration', '>', 1000) // 1000ms = 1s
            ->where('created_at', '>', now()->subHour())
            ->count();
    }
}
