<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\SyncController;
use App\Http\Controllers\DomainsController;
use App\Http\Controllers\ProxyController;
use App\Http\Controllers\SslController;
use App\Http\Controllers\RedirectsController;
use App\Http\Controllers\LogsController;
use App\Http\Controllers\UpstreamsController;
use App\Http\Controllers\RoutesController;

require __DIR__.'/auth.php';

// Protected routes - require authentication
Route::middleware(['web', 'auth'])->group(function () {
    Route::get('/', [DashboardController::class, 'index'])->name('dashboard');

    // Sync
    Route::get('/sync', [SyncController::class, 'index'])->name('sync.index');
    Route::post('/sync', [SyncController::class, 'sync'])->name('sync.run');

    // Domains CRUD
    Route::resource('domains', DomainsController::class);

    // Proxy Rules CRUD
    Route::post('/proxy/{proxyRule}/toggle', [ProxyController::class, 'toggle'])->name('proxy.toggle');
    Route::post('/proxy/deploy', [ProxyController::class, 'deploy'])->name('proxy.deploy');
    Route::resource('proxy', ProxyController::class);

    // SSL Certificates CRUD
    Route::resource('ssl', SslController::class)->except(['edit', 'update']);
    Route::post('/ssl/{certificate}/renew', [SslController::class, 'renew'])->name('ssl.renew');
    Route::post('/ssl/{certificate}/toggle', [SslController::class, 'toggle'])->name('ssl.toggle');
    Route::post('/ssl/renew-all', [SslController::class, 'renewAll'])->name('ssl.renewAll');
    Route::post('/ssl/deploy', [SslController::class, 'deploy'])->name('ssl.deploy');

    // Redirects CRUD
    Route::resource('redirects', RedirectsController::class);

    // Upstreams CRUD
    Route::resource('upstreams', UpstreamsController::class);

    // Routes CRUD (path-based rules)
    Route::resource('routes', RoutesController::class);

    // Logs
    Route::get('/logs', [LogsController::class, 'index'])->name('logs.index');
    Route::post('/logs/clear', [LogsController::class, 'clear'])->name('logs.clear');
});
