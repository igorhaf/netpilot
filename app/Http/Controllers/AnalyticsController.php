<?php

namespace App\Http\Controllers;

use App\Services\AnalyticsService;
use Inertia\Inertia;

class AnalyticsController extends Controller
{
    public function __construct(private AnalyticsService $analytics) {}

    public function index()
    {
        return Inertia::render('Analytics', [
            'stats' => $this->getDashboardStats()
        ]);
    }

    public function apiIndex()
    {
        return response()->json($this->getDashboardStats());
    }

    private function getDashboardStats(): array
    {
        return [
            'request_volume' => $this->analytics->getRequestVolume(),
            'response_times' => $this->analytics->getResponseTimes(),
            'error_rates' => $this->analytics->getErrorRates(),
            'top_endpoints' => $this->analytics->getTopEndpoints(),
            'recent_events' => $this->analytics->getRecentEvents()
        ];
    }
}
