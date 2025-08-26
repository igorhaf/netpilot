<?php

namespace App\Application\UseCases;

use App\Models\Upstream;
use Illuminate\Support\Facades\Http;

class CheckUpstreamHealth
{
    public function __invoke(?int $upstreamId = null): array
    {
        $query = Upstream::query()->where('is_active', true);
        
        if ($upstreamId) {
            $query->where('id', $upstreamId);
        }

        $upstreams = $query->get();
        $results = [];

        foreach ($upstreams as $upstream) {
            $results[] = $this->checkSingleUpstream($upstream);
        }

        return $results;
    }

    private function checkSingleUpstream(Upstream $upstream): array
    {
        $healthUrl = $upstream->target_url;
        
        if ($upstream->health_check_path) {
            $healthUrl = rtrim($upstream->target_url, '/') . '/' . ltrim($upstream->health_check_path, '/');
        }

        $startTime = microtime(true);
        $isHealthy = false;
        $statusCode = null;
        $error = null;
        $responseTime = null;

        try {
            $response = Http::timeout($upstream->timeout ?? 30)
                ->get($healthUrl);

            $responseTime = round((microtime(true) - $startTime) * 1000, 2);
            $statusCode = $response->status();
            $isHealthy = $response->successful();

        } catch (\Exception $e) {
            $responseTime = round((microtime(true) - $startTime) * 1000, 2);
            $error = $e->getMessage();
        }

        return [
            'upstream_id' => $upstream->id,
            'upstream_name' => $upstream->name,
            'target_url' => $upstream->target_url,
            'health_url' => $healthUrl,
            'is_healthy' => $isHealthy,
            'status_code' => $statusCode,
            'response_time_ms' => $responseTime,
            'error' => $error,
            'checked_at' => now()->toISOString(),
        ];
    }
}
