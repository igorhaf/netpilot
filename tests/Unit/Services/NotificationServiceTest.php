<?php

namespace Tests\Unit\Services;

use App\Services\NotificationService;
use Tests\TestCase;

class NotificationServiceTest extends TestCase
{
    public function test_send_notification(): void
    {
        $service = new NotificationService('mail', []);
        $result = $service->send('Test message', ['user@example.com']);
        $this->assertTrue($result);
    }

    public function test_test_connection(): void
    {
        $service = new NotificationService('mail', []);
        $result = $service->testConnection();
        $this->assertTrue($result);
    }
}
