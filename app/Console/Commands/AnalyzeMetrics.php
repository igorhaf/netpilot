<?php

namespace App\Console\Commands;

use App\Services\MetricsService;
use Illuminate\Console\Command;

class AnalyzeMetrics extends Command
{
    protected $signature = 'metrics:analyze';
    protected $description = 'Analyze system performance metrics';

    public function __construct(private MetricsService $metrics)
    {
        parent::__construct();
    }

    public function handle()
    {
        $this->info('Analyzing system metrics...');
        
        // API Performance
        $responseTimes = $this->metrics->getResponseTimePercentiles();
        $this->table(
            ['Metric', 'Value'],
            [
                ['Average Response Time', $responseTimes['avg'].'ms'],
                ['P95 Response Time', $responseTimes['p95'].'ms'],
                ['P99 Response Time', $responseTimes['p99'].'ms']
            ]
        );
        
        // Error Rates
        $errorRate = $this->metrics->calculateErrorRate();
        $this->info("Error Rate: ".round($errorRate*100, 2)."%");
        
        // Upstream Health
        $upstreamHealth = $this->metrics->getUpstreamHealthStatus();
        $this->table(
            ['Upstream', 'Status', 'Response Time'],
            $upstreamHealth
        );
        
        return self::SUCCESS;
    }
}
