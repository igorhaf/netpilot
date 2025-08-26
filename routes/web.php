<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\SyncController;
use App\Http\Controllers\DomainsController;
use App\Http\Controllers\UpstreamsController;
use App\Http\Controllers\RoutesController;
use App\Http\Controllers\RedirectsController;

Route::middleware('web')->group(function () {
    Route::get('/', [DashboardController::class, 'index'])->name('dashboard');
    
    // Domains CRUD
    Route::resource('domains', DomainsController::class);
    Route::resource('upstreams', UpstreamsController::class);
    Route::resource('routes', RoutesController::class);
    Route::resource('redirects', RedirectsController::class);
    
    // Sync
    Route::get('/sync', [SyncController::class, 'index'])->name('sync.index');
    Route::post('/sync', [SyncController::class, 'sync'])->name('sync.store');
    Route::get('/test', function () {
        try {
            // Create sample data if none exists
            if (\App\Models\Domain::count() === 0) {
                $domain = \App\Models\Domain::create([
                    'name' => 'app.localtest.me',
                    'description' => 'Demo application domain',
                    'auto_tls' => false,
                    'is_active' => true,
                ]);

                $upstream = \App\Models\Upstream::create([
                    'domain_id' => $domain->id,
                    'name' => 'app-container',
                    'target_url' => 'http://laravel.test:80',
                    'weight' => 1,
                    'is_active' => true,
                    'health_check_path' => '/health',
                    'health_check_interval' => 30,
                    'description' => 'Main application container',
                ]);

                \App\Models\RouteRule::create([
                    'domain_id' => $domain->id,
                    'upstream_id' => $upstream->id,
                    'path_pattern' => '/',
                    'http_method' => '*',
                    'priority' => 100,
                    'is_active' => true,
                    'strip_prefix' => false,
                    'preserve_host' => true,
                    'timeout' => 30,
                ]);

                \App\Models\RedirectRule::create([
                    'domain_id' => $domain->id,
                    'source_pattern' => '/old',
                    'target_url' => 'https://app.localtest.me/new',
                    'redirect_type' => 301,
                    'priority' => 100,
                    'is_active' => true,
                    'preserve_query' => true,
                ]);
            }
            
            // Test database schema and relationships
            $domainCount = \App\Models\Domain::count();
            $upstreamCount = \App\Models\Upstream::count();
            $routeCount = \App\Models\RouteRule::count();
            $redirectCount = \App\Models\RedirectRule::count();
            
            return response()->json([
                'message' => 'Database schema working',
                'counts' => [
                    'domains' => $domainCount,
                    'upstreams' => $upstreamCount,
                    'routes' => $routeCount,
                    'redirects' => $redirectCount,
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ], 500);
        }
    });
});
