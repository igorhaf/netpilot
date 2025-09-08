<?php

use Illuminate\Support\Facades\Route;
use Prometheus\CollectorRegistry;
use Prometheus\Storage\APC;

Route::get('/metrics', function () {
    $registry = new CollectorRegistry(new APC());
    
    // Render metrics in Prometheus text format
    $renderer = new Prometheus\RenderTextFormat();
    $result = $renderer->render($registry->getMetricFamilySamples());
    
    return response($result, 200, ['Content-Type' => 'text/plain']);
})->middleware('api');
