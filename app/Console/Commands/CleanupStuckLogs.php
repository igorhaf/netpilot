<?php

namespace App\Console\Commands;

use App\Models\DeploymentLog;
use Illuminate\Console\Command;

class CleanupStuckLogs extends Command
{
    protected $signature = 'logs:cleanup-stuck {--force : Force cleanup without confirmation}';
    protected $description = 'Clean up stuck deployment logs';

    public function handle()
    {
        $this->info('🧹 Limpando logs travados...');
        
        // Contar logs travados
        $stuckLogs = DeploymentLog::where('status', 'running')
            ->where(function ($query) {
                $query->where('started_at', '<', now()->subHour())
                      ->orWhereNull('started_at');
            })
            ->get();
        
        if ($stuckLogs->isEmpty()) {
            $this->info('✅ Nenhum log travado encontrado.');
            return 0;
        }
        
        $this->warn("⚠️  Encontrados {$stuckLogs->count()} logs travados:");
        
        foreach ($stuckLogs as $log) {
            $this->line("  - ID: {$log->id}, Type: {$log->type}, Action: {$log->action}");
            if ($log->started_at) {
                $this->line("    Iniciado: {$log->started_at} (há " . $log->started_at->diffForHumans() . ")");
            } else {
                $this->line("    Iniciado: N/A (log órfão)");
            }
        }
        
        if (!$this->option('force')) {
            if (!$this->confirm('Deseja limpar estes logs travados?')) {
                $this->info('❌ Operação cancelada.');
                return 0;
            }
        }
        
        // Limpar logs travados
        $deletedCount = $stuckLogs->count();
        DeploymentLog::whereIn('id', $stuckLogs->pluck('id'))->delete();
        
        $this->info("✅ {$deletedCount} logs travados removidos com sucesso!");
        
        return 0;
    }
}
