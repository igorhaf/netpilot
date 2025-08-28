<?php

namespace App\Console\Commands;

use App\Services\TraefikService;
use Illuminate\Console\Command;

class ApplyTraefikConfig extends Command
{
    protected $signature = 'traefik:apply-config {--force : Força aplicação mesmo se houver erros}';
    protected $description = 'Aplica a configuração do Traefik no sistema';

    public function handle(TraefikService $traefikService)
    {
        $this->info('🚀 Aplicando configuração do Traefik...');
        
        try {
            $result = $traefikService->applyConfiguration();
            
            if ($result['success']) {
                $this->info('✅ Configuração aplicada com sucesso!');
                $this->line('📁 Arquivo local: ' . $result['local_file']);
                
                if (isset($result['traefik_file'])) {
                    $this->line('📁 Arquivo Traefik: ' . $result['traefik_file']);
                    if (isset($result['note'])) {
                        $this->line('📝 ' . $result['note']);
                    }
                    if (isset($result['reload_result']['message'])) {
                        $this->line('🔄 ' . $result['reload_result']['message']);
                    }
                }
                
            } else {
                $this->warn('⚠️  Configuração não foi aplicada completamente:');
                $this->line('📁 Arquivo local: ' . ($result['local_file'] ?? 'N/A'));
                
                if (isset($result['traefik_file'])) {
                    $this->line('📁 Arquivo Traefik: ' . $result['traefik_file']);
                }
                
                if (isset($result['traefik_error'])) {
                    $this->error('❌ Erro Traefik: ' . $result['traefik_error']);
                }
                
                if (isset($result['reload_error'])) {
                    $this->error('❌ Erro reload: ' . $result['reload_error']);
                }
                
                $this->line('');
                $this->info('💡 Arquivo local foi gerado. Para aplicar manualmente:');
                $this->line('   1. Copie o arquivo para /etc/traefik/dynamic/netpilot-proxy.yml');
                $this->line('   2. Execute: systemctl reload traefik');
            }
            
        } catch (\Exception $e) {
            $this->error('💥 Erro inesperado: ' . $e->getMessage());
            $this->error('Arquivo: ' . $e->getFile() . ':' . $e->getLine());
        }
        
        return 0;
    }
}
