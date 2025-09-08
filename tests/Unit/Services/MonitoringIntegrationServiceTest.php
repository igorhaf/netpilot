<?php

namespace Tests\Unit\Services;

use App\Services\MonitoringIntegrationService;
use Tests\TestCase;

class MonitoringIntegrationServiceTest extends TestCase
{
    public function test_send_metrics(): void
    {
        $service = new MonitoringIntegrationService('prometheus', []);
        $result = $service->sendMetrics(['response_time' => 150]);
        $this->assertTrue($result);
    }

    public function test_create_alert(): void
    {
        $service = new MonitoringIntegrationService('prometheus', []);
        $result = $service->createAlert('HighErrorRate', ['condition' => 'errors > 5']);
        $this->assertTrue($result);
    }
}
