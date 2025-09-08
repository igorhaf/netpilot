<?php

namespace App\Services;

use App\Models\AnalyticsData;
use Carbon\Carbon;

class AnalyticsService
{
    public function recordRequest(string $route, int $durationMs, int $statusCode): void
    {
        AnalyticsData::create([
            'type' => 'request',
            'key' => $route,
            'value' => $durationMs,
            'metadata' => [
                'status_code' => $statusCode,
                'timestamp' => now()
            ]
        ]);
    }

    public function recordEvent(string $eventType, array $data): void
    {
        AnalyticsData::create([
            'type' => 'event',
            'key' => $eventType,
            'value' => 1,
            'metadata' => $data
        ]);
    }

    public function getRequestStats(string $route, Carbon $from, Carbon $to): array
    {
        return AnalyticsData::where('type', 'request')
            ->where('key', $route)
            ->whereBetween('created_at', [$from, $to])
            ->get()
            ->groupBy(function($item) {
                return $item->created_at->format('Y-m-d H:00');
            })
            ->map(function($group) {
                return [
                    'count' => $group->count(),
                    'avg_duration' => $group->avg('value'),
                    'error_rate' => $group->whereIn('metadata->status_code', [500, 502, 503, 504])->count() / $group->count() * 100
                ];
            });
    }
}
