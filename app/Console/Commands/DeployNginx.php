<?php

namespace App\Console\Commands;

use App\Services\NginxService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class DeployNginx extends Command
{
    protected $signature = 'nginx:deploy {--force : Force deployment even if no changes} {--dry-run : Show what would be deployed without actually doing it}';
    protected $description = 'Deploy Nginx configuration with all active proxy rules';

    public function __construct(
        private NginxService $nginxService
    ) {
        parent::__construct();
    }

    public function handle()
    {
        $this->info('🌐 Iniciando deploy da configuração do Nginx...');

        if ($this->option('dry-run')) {
            $this->warn('📝 [DRY-RUN] Modo de simulação ativado');
            $this->info('   Seria executado: deploy da configuração do Nginx');
            $this->info('   Seria executado: teste de configuração');
            $this->info('   Seria executado: reload do serviço');
            $this->info('✅ Simulação concluída');
            return 0;
        }

        try {
            $this->info('🔧 Gerando configuração do Nginx...');
            
            $result = $this->nginxService->deployConfiguration();
            
            if ($result['success']) {
                $this->info("✅ Configuração do Nginx aplicada com sucesso!");
                $this->info("   📊 Regras de proxy: {$result['rules_count']}");
                
                // Test configuration
                $this->info('🧪 Testando configuração...');
                $testResult = $this->nginxService->testConfiguration();
                
                if ($testResult['success']) {
                    $this->info('✅ Configuração do Nginx é válida');
                } else {
                    $this->warn('⚠️  Configuração do Nginx tem problemas');
                    $this->line("   Erro: {$testResult['error']}");
                }
                
                // Check status
                $this->info('📊 Verificando status do Nginx...');
                $status = $this->nginxService->getStatus();
                
                if ($status['running']) {
                    $this->info('✅ Nginx está rodando');
                } else {
                    $this->warn('⚠️  Nginx não está rodando');
                }
                
                if ($status['config_valid']) {
                    $this->info('✅ Configuração do Nginx é válida');
                } else {
                    $this->warn('⚠️  Configuração do Nginx tem problemas');
                }
                
                $this->info('🎉 Deploy do Nginx concluído com sucesso!');
                return 0;
                
            } else {
                $this->error("❌ Falha no deploy: {$result['message']}");
                return 1;
            }

        } catch (\Exception $e) {
            $this->error("❌ Erro no deploy: {$e->getMessage()}");
            
            Log::error('Nginx deployment failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            
            return 1;
        }
    }
}
