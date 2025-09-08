<?php

namespace App\Providers;

use App\Events\WebhookEvents;
use App\Listeners\BroadcastSyncProgress;
use App\Listeners\DispatchWebhook;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;

class EventServiceProvider extends ServiceProvider
{
    protected $listen = [
        'App\Events\SyncProgress' => [
            'App\Listeners\BroadcastSyncProgress',
        ],
        
        // Webhook Events
        WebhookEvents::DOMAIN_CREATED => [
            DispatchWebhook::class,
        ],
        WebhookEvents::DOMAIN_UPDATED => [
            DispatchWebhook::class,
        ],
        WebhookEvents::DOMAIN_DELETED => [
            DispatchWebhook::class,
        ],
        WebhookEvents::DOMAIN_TRANSFERRED => [
            DispatchWebhook::class,
        ],
        WebhookEvents::DOMAIN_EXPIRED => [
            DispatchWebhook::class,
        ],
        WebhookEvents::DOMAIN_RENEWED => [
            DispatchWebhook::class,
        ],
    ];

    public function boot(): void
    {
        parent::boot();
    }
}
