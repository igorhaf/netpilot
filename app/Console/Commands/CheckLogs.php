<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\DeploymentLog;
use Illuminate\Support\Facades\Schema;

class CheckLogs extends Command
{
    protected $signature = 'logs:check';
    protected $description = 'Check the status of deployment_logs table';

    public function handle()
    {
        $this->info('🔍 Verificando tabela deployment_logs...');
        
        // Check if table exists
        if (!Schema::hasTable('deployment_logs')) {
            $this->error('❌ Tabela deployment_logs não existe!');
            return 1;
        }
        
        $this->info('✅ Tabela deployment_logs existe');
        
        // Check table structure
        $columns = Schema::getColumnListing('deployment_logs');
        $this->info('📋 Colunas: ' . implode(', ', $columns));
        
        // Check if type column is enum or string
        $typeColumn = Schema::getConnection()->getDoctrineSchemaManager()->listTableColumns('deployment_logs')['type'];
        $this->info('🔧 Tipo da coluna type: ' . get_class($typeColumn));
        
        // Count records
        $total = DeploymentLog::count();
        $this->info("📊 Total de registros: {$total}");
        
        if ($total > 0) {
            $this->info('📝 Últimos 5 registros:');
            $logs = DeploymentLog::latest()->take(5)->get();
            foreach ($logs as $log) {
                $this->line("  - ID: {$log->id}, Type: {$log->type}, Action: {$log->action}, Status: {$log->status}");
            }
        } else {
            $this->warn('⚠️  Nenhum registro encontrado');
        }
        
        return 0;
    }
}
