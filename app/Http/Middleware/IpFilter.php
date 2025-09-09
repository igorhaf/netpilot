<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Log;

class IpFilter
{
    public function handle(Request $request, Closure $next)
    {
        Log::debug('IP Filter Middleware executing', [
            'ip' => $request->ip(),
            'path' => $request->path()
        ]);

        $blacklist = config('security.ip_blacklist', []);
        $whitelist = config('security.ip_whitelist', []);
        
        // Check whitelist first
        if (!empty($whitelist) && !in_array($request->ip(), $whitelist)) {
            Log::warning('IP not in whitelist', ['ip' => $request->ip()]);
            return response()->json(['error' => 'IP not allowed'], Response::HTTP_FORBIDDEN);
        }
        
        // Check blacklist
        if (in_array($request->ip(), $blacklist)) {
            Log::warning('IP in blacklist', ['ip' => $request->ip()]);
            return response()->json(['error' => 'IP blocked'], Response::HTTP_FORBIDDEN);
        }
        
        return $next($request);
    }
}
