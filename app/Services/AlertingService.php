<?php

namespace App\Services;

use App\Models\Alert;
use App\Models\AnalyticsData;
use App\Services\WebhookDispatcherService;

class AlertingService
{
    public function __construct(
        private WebhookDispatcherService $webhookDispatcher
    ) {}

    public function checkThresholds(): void
    {
        // Check for high error rates
        $errorRate = AnalyticsData::where('type', 'request')
            ->where('metadata->status_code', '>=', 500)
            ->where('created_at', '>', now()->subHour())
            ->count() / 
            max(1, AnalyticsData::where('type', 'request')
                ->where('created_at', '>', now()->subHour())
                ->count());

        if ($errorRate > 0.05) { // 5% error rate threshold
            $this->triggerAlert('high_error_rate', [
                'error_rate' => round($errorRate * 100, 2),
                'threshold' => 5
            ]);
        }

        // Check for slow response times
        $slowRequests = AnalyticsData::where('type', 'request')
            ->where('value', '>', 1000) // 1000ms threshold
            ->where('created_at', '>', now()->subHour())
            ->count();

        if ($slowRequests > 10) {
            $this->triggerAlert('slow_responses', [
                'count' => $slowRequests,
                'threshold_ms' => 1000
            ]);
        }
    }

    private function triggerAlert(string $type, array $data): void
    {
        // Create alert record
        $alert = Alert::create([
            'type' => $type,
            'severity' => 'high',
            'data' => $data,
            'resolved_at' => null
        ]);

        // Dispatch webhook notification
        $this->webhookDispatcher->dispatch('alert.triggered', [
            'alert_id' => $alert->id,
            'type' => $type,
            'severity' => 'high',
            'data' => $data,
            'timestamp' => now()->toISOString()
        ]);
    }
}
