<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Infra\Traefik\TraefikProvider;
use App\Services\ReconcilerService;
use App\Services\TraefikService;
use App\Services\NginxService;

class NetPilotServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        // Bind TraefikProvider
        $this->app->singleton(TraefikProvider::class, function ($app) {
            $dynamicDir = config('netpilot.dynamic_dir', base_path('docker/traefik/dynamic'));
            return new TraefikProvider($dynamicDir);
        });

        // Bind ReconcilerService
        $this->app->singleton(ReconcilerService::class, function ($app) {
            return new ReconcilerService(
                $app->make(TraefikProvider::class),
                $app->make(TraefikService::class),
                $app->make(NginxService::class)
            );
        });
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        //
    }
}
