<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use App\Services\AnalyticsService;

class MeasureResponseTime
{
    public function __construct(private AnalyticsService $analytics) {}

    public function handle(Request $request, Closure $next)
    {
        $start = microtime(true);
        
        /** @var Response $response */
        $response = $next($request);
        
        $duration = microtime(true) - $start;
        
        $this->analytics->recordRequest(
            $request->path(), 
            round($duration * 1000),
            $response->getStatusCode()
        );
        
        return $response;
    }
}
