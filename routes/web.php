<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\SyncController;
use App\Http\Controllers\DomainsController;
use App\Http\Controllers\ProxyController;
use App\Http\Controllers\SslController;
use App\Http\Controllers\RedirectsController;
use App\Http\Controllers\LogsController;

Route::middleware('web')->group(function () {
    Route::get('/', [DashboardController::class, 'index'])->name('dashboard');

    // Domains CRUD
    Route::resource('domains', DomainsController::class);

    // Proxy Rules CRUD
    Route::resource('proxy', ProxyController::class);
    Route::post('/proxy/{proxyRule}/toggle', [ProxyController::class, 'toggle'])->name('proxy.toggle');
    Route::post('/proxy/deploy', [ProxyController::class, 'deploy'])->name('proxy.deploy');

    // SSL Certificates CRUD
    Route::resource('ssl', SslController::class)->except(['edit', 'update']);
    Route::post('/ssl/{certificate}/renew', [SslController::class, 'renew'])->name('ssl.renew');
    Route::post('/ssl/{certificate}/toggle', [SslController::class, 'toggle'])->name('ssl.toggle');
    Route::post('/ssl/renew-all', [SslController::class, 'renewAll'])->name('ssl.renewAll');
    Route::post('/ssl/deploy', [SslController::class, 'deploy'])->name('ssl.deploy');

    // Redirects CRUD
    Route::resource('redirects', RedirectsController::class);

    // Logs
    Route::get('/logs', [LogsController::class, 'index'])->name('logs.index');
        Route::get('/test', function () {
        try {
            // Create sample data if none exists
            if (\App\Models\Domain::count() === 0) {
                $domain = \App\Models\Domain::create([
                    'name' => 'app.localtest.me',
                    'description' => 'Demo application domain',
                    'auto_ssl' => false,
                    'is_active' => true,
                ]);

                \App\Models\ProxyRule::create([
                    'domain_id' => $domain->id,
                    'source_host' => 'app.localtest.me',
                    'source_port' => '80',
                    'target_host' => 'localhost',
                    'target_port' => '8080',
                    'protocol' => 'http',
                    'priority' => 100,
                    'is_active' => true,
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
            $proxyCount = \App\Models\ProxyRule::count();
            $redirectCount = \App\Models\RedirectRule::count();
            
            return response()->json([
                'message' => 'Database schema working',
                'counts' => [
                    'domains' => $domainCount,
                    'proxy_rules' => $proxyCount,
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
