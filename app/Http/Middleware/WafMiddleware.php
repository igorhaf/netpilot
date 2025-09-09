<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use App\Services\WafService;

class WafMiddleware
{
    public function __construct(private WafService $waf) {}

    public function handle(Request $request, Closure $next)
    {
        // Check request against WAF rules
        $wafResult = $this->waf->inspectRequest($request);
        
        if ($wafResult->isBlocked()) {
            return response()->json([
                'error' => 'Request blocked by WAF',
                'reason' => $wafResult->getReason()
            ], 403);
        }

        return $next($request);
    }
}
