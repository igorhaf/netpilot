<?php

namespace App\Console\Commands;

use App\Services\MetricsService;
use Illuminate\Console\Command;

class MonitorMetrics extends Command
{
    protected $signature = 'metrics:monitor';
    protected $description = 'Monitor production metrics and alert on anomalies';

    public function __construct(private MetricsService $metrics)
    {
        parent::__construct();
    }

    public function handle()
    {
        $this->metrics->checkForAnomalies();
        $this->info('Production metrics monitored successfully');
        return self::SUCCESS;
    }
}
