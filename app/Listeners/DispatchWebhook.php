<?php

namespace App\Listeners;

use App\Events\WebhookEvents;
use App\Services\WebhookDispatcherService;

class DispatchWebhook
{
    public function __construct(
        private WebhookDispatcherService $dispatcher
    ) {}

    public function handle($event)
    {
        $eventType = $this->getEventType($event);
        $payload = $this->getPayload($event);
        
        $this->dispatcher->dispatch($eventType, $payload);
    }

    private function getEventType($event): string
    {
        // Map event class to webhook event type
        $map = [
            // Domain events
            \App\Events\DomainCreated::class => WebhookEvents::DOMAIN_CREATED,
            // ... map all other events ...
        ];

        return $map[get_class($event)] ?? 'unknown';
    }

    private function getPayload($event): array
    {
        return [
            'event' => $this->getEventType($event),
            'data' => $event->getPayload(),
            'timestamp' => now()->toISOString()
        ];
    }
}
