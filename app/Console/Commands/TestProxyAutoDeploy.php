<?php

namespace App\Console\Commands;

use App\Models\ProxyRule;
use App\Services\TraefikService;
use Illuminate\Console\Command;

class TestProxyAutoDeploy extends Command
{
    protected $signature = 'proxy:test-auto-deploy';
    protected $description = 'Testa o deploy automático do Traefik após operações de proxy';

    public function __construct(private TraefikService $traefikService)
    {
        parent::__construct();
    }

    public function handle()
    {
        $this->info('🧪 Testando deploy automático do Traefik...');

        // 1. Testar geração de configuração
        $this->info('📝 1. Gerando configuração...');
        $configResult = $this->traefikService->generateConfiguration();
        
        if ($configResult['success']) {
            $this->info('✅ Configuração gerada com sucesso!');
            $this->line("📁 Arquivo: {$configResult['file_path']}");
            $this->line("📏 Tamanho: {$configResult['file_size']} bytes");
        } else {
            $this->error('❌ Falha ao gerar configuração: ' . $configResult['message']);
            return 1;
        }

        // 2. Testar aplicação da configuração
        $this->info('🚀 2. Aplicando configuração...');
        $deployResult = $this->traefikService->applyConfiguration();
        
        if ($deployResult['success']) {
            $this->info('✅ Configuração aplicada com sucesso!');
            $this->line("📁 Arquivo local: {$deployResult['local_file']}");
            $this->line("📁 Arquivo Traefik: {$deployResult['traefik_file']}");
            if (isset($deployResult['note'])) {
                $this->line("📝 {$deployResult['note']}");
            }
        } else {
            $this->error('❌ Falha ao aplicar configuração: ' . $deployResult['message']);
            return 1;
        }

        // 3. Verificar regras ativas
        $this->info('🔍 3. Verificando regras ativas...');
        $activeRules = ProxyRule::where('is_active', true)->count();
        $this->line("📊 Regras ativas: {$activeRules}");

        if ($activeRules > 0) {
            $this->info('📋 Regras encontradas:');
            ProxyRule::where('is_active', true)->get()->each(function ($rule) {
                $this->line("   • {$rule->source_host}:{$rule->source_port} → {$rule->target_host}:{$rule->target_port} ({$rule->protocol})");
            });
        }

        // 4. Testar API do Traefik
        $this->info('🌐 4. Testando API do Traefik...');
        try {
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, 'http://localhost:8080/api/http/services');
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_TIMEOUT, 5);
            
            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);
            
            if ($httpCode === 200) {
                $this->info('✅ API Traefik acessível');
                $this->line("📡 HTTP Code: {$httpCode}");
            } else {
                $this->warn("⚠️ API Traefik retornou HTTP {$httpCode}");
            }
        } catch (\Exception $e) {
            $this->error('❌ Erro ao acessar API Traefik: ' . $e->getMessage());
        }

        $this->info('🎉 Teste concluído com sucesso!');
        $this->line('');
        $this->line('💡 Para testar o redirecionamento:');
        $this->line('   curl -H "Host: framily.space" http://localhost:80');
        
        return 0;
    }
}
