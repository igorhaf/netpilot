<?php

namespace App\Console\Commands;

use App\Services\TraefikService;
use Illuminate\Console\Command;

class TestTraefikConfig extends Command
{
    protected $signature = 'traefik:test-config';
    protected $description = 'Testa a geração de configuração do Traefik';

    public function handle(TraefikService $traefikService)
    {
        $this->info('🧪 Testando geração de configuração do Traefik...');
        
        try {
            $result = $traefikService->generateConfiguration();
            
            if ($result['success']) {
                $this->info('✅ Configuração gerada com sucesso!');
                $this->line('📁 Arquivo salvo em: ' . $result['debug_info']['storage_path']);
                $this->line('📏 Tamanho: ' . $result['file_size'] . ' bytes');
                $this->line('');
                $this->line('📋 Preview da configuração:');
                $this->line('─' . str_repeat('─', 50));
                $this->line($result['config_preview']);
                $this->line('─' . str_repeat('─', 50));
                $this->line('');
                $this->info('💡 Para aplicar no Traefik, execute: php artisan traefik:apply-config');
                
            } else {
                $this->error('❌ Falha ao gerar configuração: ' . $result['message']);
                if (isset($result['error'])) {
                    $this->error('Detalhes: ' . $result['error']);
                }
            }
            
        } catch (\Exception $e) {
            $this->error('💥 Erro inesperado: ' . $e->getMessage());
            $this->error('Arquivo: ' . $e->getFile() . ':' . $e->getLine());
        }
        
        return 0;
    }
}
