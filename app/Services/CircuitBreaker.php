<?php

namespace App\Services;

use App\Models\Upstream;
use Illuminate\Support\Facades\Cache;

class CircuitBreaker
{
    private const FAILURE_THRESHOLD = 3;
    private const RETRY_TIMEOUT = 60; // seconds
    
    public function isAvailable(Upstream $upstream): bool
    {
        $key = "circuit_breaker:{$upstream->id}";
        
        // If circuit is open and timeout hasn't expired
        if (Cache::get($key.':open')) {
            return false;
        }
        
        return true;
    }
    
    public function recordFailure(Upstream $upstream): void
    {
        $key = "circuit_breaker:{$upstream->id}";
        $failures = Cache::increment($key.':failures');
        
        if ($failures >= self::FAILURE_THRESHOLD) {
            Cache::put($key.':open', true, self::RETRY_TIMEOUT);
            Cache::forget($key.':failures');
        }
    }
    
    public function recordSuccess(Upstream $upstream): void
    {
        $key = "circuit_breaker:{$upstream->id}";
        Cache::forget($key.':failures');
    }
}
