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
        $schedule->command('ssl:renew')
            ->dailyAt('02:00')
            ->withoutOverlapping()
            ->runInBackground();

        // Deploy do Nginx a cada 5 minutos se houver mudanças
        $schedule->command('nginx:deploy')
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
