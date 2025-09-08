<?php

namespace App\Services;

class NotificationService
{
    public function __construct(
        private string $channel,
        private array $config
    ) {}

    public function send(
        string $message,
        array $recipients,
        ?string $subject = null
    ): bool {
        // Implementation will vary by channel
        return true;
    }

    public function testConnection(): bool
    {
        // Verify channel connectivity
        return true;
    }
}
