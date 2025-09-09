<?php

namespace App\Console\Commands;

use App\Services\AlertingService;
use Illuminate\Console\Command;

class MonitorAlerts extends Command
{
    protected $signature = 'alerts:monitor';
    protected $description = 'Monitor system metrics and trigger alerts';

    public function __construct(private AlertingService $alertingService)
    {
        parent::__construct();
    }

    public function handle()
    {
        $this->alertingService->checkThresholds();
        $this->info('Alert monitoring completed');
        return 0;
    }
}
