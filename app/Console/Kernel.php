<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    /**
     * Define the application's command schedule.
     */
    protected function schedule(Schedule $schedule): void
    {
        // Renovar certificados SSL diariamente às 2:00 AM
        $schedule->command('proxy:renew')
            ->dailyAt('02:00')
            ->withoutOverlapping()
            ->runInBackground()
            ->appendOutputTo(storage_path('logs/ssl-renewal.log'));

        // Reconciliar configurações periodicamente
        $reconcileInterval = config('netpilot.reconcile_interval', 60);
        if (config('netpilot.reconcile_enabled', true)) {
            $schedule->command('proxy:reconcile')
                ->everyMinutes($reconcileInterval / 60)
                ->withoutOverlapping()
                ->runInBackground()
                ->appendOutputTo(storage_path('logs/reconciliation.log'));
        }

        // Deploy do Traefik se houver mudanças
        $schedule->command('proxy:deploy')
            ->everyFiveMinutes()
            ->withoutOverlapping()
            ->runInBackground();

        // Limpar logs antigos semanalmente
        $schedule->command('logs:cleanup')
            ->weekly()
            ->withoutOverlapping();
    }

    /**
     * Register the commands for the application.
     */
    protected function commands(): void
    {
        $this->load(__DIR__.'/Commands');

        require base_path('routes/console.php');
    }
}
