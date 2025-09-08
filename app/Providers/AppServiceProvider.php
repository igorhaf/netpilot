<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Prometheus\CollectorRegistry;
use Prometheus\Storage\InMemory;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Request;
use App\Services\CloudflareWafService;

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
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Add request context to all logs
        Log::shareContext([
            'request_id' => Request::header('X-Request-ID') ?? uniqid(),
            'ip' => Request::ip(),
            'user_agent' => Request::userAgent(),
        ]);
    }
}
