<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\URL;

class ForceHttps
{
    public function handle(Request $request, Closure $next)
    {
        // Force HTTPS URLs in production
        if (config('app.force_https', false)) {
            URL::forceScheme('https');
            
            // Set secure headers for mixed content
            $response = $next($request);
            
            if (method_exists($response, 'header')) {
                $response->header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
                $response->header('Content-Security-Policy', 'upgrade-insecure-requests');
            }
            
            return $response;
        }

        return $next($request);
    }
}
