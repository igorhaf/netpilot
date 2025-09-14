<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Prometheus\CollectorRegistry;
use Prometheus\Storage\InMemory;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Request;
use Illuminate\Support\Facades\URL;
use App\Services\CloudflareWafService;
use App\Services\CircuitBreakerService;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton('Prometheus\Storage\Adapter', function () {
            return new InMemory();
        });

        $this->app->bind(CloudflareWafService::class, function () {
            return new CloudflareWafService(
                config('services.cloudflare.api_key'),
                config('services.cloudflare.zone_id')
            );
        });

        $this->app->bind(CircuitBreakerService::class, function ($app) {
            return new CircuitBreakerService(
                'default-service', // Default service name
                3, // failureThreshold
                60 // resetTimeout
            );
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Force HTTPS URLs when APP_FORCE_HTTPS is enabled
        if (config('app.force_https', false)) {
            URL::forceScheme('https');
        }

        // Add request context to all logs
        Log::shareContext([
            'request_id' => Request::header('X-Request-ID') ?? uniqid(),
            'ip' => Request::ip(),
            'user_agent' => Request::userAgent(),
        ]);
    }
}
