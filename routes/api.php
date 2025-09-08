<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

// Public routes
Route::prefix('v1')->group(function () {
    Route::get('/health', function () {
        return response()->json(['status' => 'ok']);
    })->withoutMiddleware([
        \App\Http\Middleware\IpFilter::class,
        \App\Http\Middleware\GeoBlock::class,
        \App\Http\Middleware\RateLimiter::class
    ]);

    // Authentication routes
    Route::post('/login', [\App\Http\Controllers\Api\V1\AuthController::class, 'login']);
    Route::post('/logout', [\App\Http\Controllers\Api\V1\AuthController::class, 'logout'])
        ->middleware('auth:sanctum');

    // Circuit Breaker
    Route::get('/circuit-breakers', [\App\Http\Controllers\Api\V1\CircuitBreakerController::class, 'index']);
    Route::post('/circuit-breakers/execute', [\App\Http\Controllers\Api\V1\CircuitBreakerController::class, 'execute']);
});

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    // Version 1 API routes
    Route::prefix('v1')->group(function () {
        // Tenant management
        Route::apiResource('tenants', \App\Http\Controllers\Api\V1\TenantController::class);
        
        // Domain management
        Route::apiResource('domains', \App\Http\Controllers\Api\V1\DomainController::class);
        
        // Proxy rules
        Route::apiResource('proxy-rules', \App\Http\Controllers\Api\V1\ProxyRuleController::class);
        
        // SSL certificates
        Route::apiResource('ssl-certificates', \App\Http\Controllers\Api\V1\SslCertificateController::class);
        
        // Upstreams
        Route::apiResource('upstreams', \App\Http\Controllers\Api\V1\UpstreamController::class);
    });
});
