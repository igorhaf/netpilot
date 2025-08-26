<?php

namespace App\Console\Commands;

use App\Models\DeploymentLog;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class CleanupLogs extends Command
{
    protected $signature = 'logs:cleanup {--days=30 : Keep logs from last N days} {--force : Force cleanup without confirmation}';
    protected $description = 'Clean up old deployment logs';

    public function handle()
    {
        $days = (int) $this->option('days');
        $cutoffDate = now()->subDays($days);

        $this->info("🧹 Iniciando limpeza de logs antigos...");
        $this->info("   📅 Mantendo logs dos últimos {$days} dias");
        $this->info("   🗓️  Removendo logs anteriores a: {$cutoffDate->format('Y-m-d H:i:s')}");

        // Count logs to be deleted
        $logsToDelete = DeploymentLog::where('created_at', '<', $cutoffDate)->count();

        if ($logsToDelete === 0) {
            $this->info('✅ Nenhum log antigo encontrado para remoção');
            return 0;
        }

        $this->warn("⚠️  {$logsToDelete} log(s) serão removidos");

        if (!$this->option('force')) {
            if (!$this->confirm('Deseja continuar com a limpeza?')) {
                $this->info('❌ Operação cancelada pelo usuário');
                return 0;
            }
        }

        try {
            $this->info('🗑️  Removendo logs antigos...');
            
            $deleted = DeploymentLog::where('created_at', '<', $cutoffDate)->delete();
            
            $this->info("✅ {$deleted} log(s) removidos com sucesso");
            
            // Show summary
            $remainingLogs = DeploymentLog::count();
            $this->info("📊 Logs restantes no sistema: {$remainingLogs}");
            
            return 0;

        } catch (\Exception $e) {
            $this->error("❌ Erro durante a limpeza: {$e->getMessage()}");
            return 1;
        }
    }
}
