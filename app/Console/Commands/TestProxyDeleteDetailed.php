<?php

namespace App\Console\Commands;

use App\Models\ProxyRule;
use App\Models\Domain;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class TestProxyDeleteDetailed extends Command
{
    protected $signature = 'proxy:test-delete-detailed';
    protected $description = 'Test proxy deletion in detail';

    public function handle()
    {
        $this->info("🔍 Teste detalhado de exclusão de proxy");
        
        // Listar todos os proxies
        $proxies = ProxyRule::with('domain')->get();
        $this->info("📊 Total de proxies: " . $proxies->count());
        
        if ($proxies->isEmpty()) {
            $this->warn("⚠️ Nenhum proxy encontrado!");
            return;
        }
        
        foreach ($proxies as $proxy) {
            $this->line("  - ID: {$proxy->id}, Host: {$proxy->source_host}, Domain: " . ($proxy->domain ? $proxy->domain->name : 'NULL'));
        }
        
        // Pegar o primeiro proxy para testar
        $testProxy = $proxies->first();
        $this->info("🎯 Testando exclusão do proxy ID: {$testProxy->id}");
        
        try {
            // Verificar constraints
            $this->info("🔍 Verificando constraints...");
            $domainExists = Domain::find($testProxy->domain_id);
            $this->info("📋 Domínio associado " . ($domainExists ? "existe" : "NÃO EXISTE"));
            
            // Tentar exclusão via Eloquent
            $this->info("🗑️ Tentando exclusão via Eloquent...");
            $deleted = $testProxy->delete();
            $this->info("✅ Delete() retornou: " . ($deleted ? 'true' : 'false'));
            
            // Verificar se ainda existe
            $stillExists = ProxyRule::find($testProxy->id);
            if ($stillExists) {
                $this->error("❌ ERRO: Proxy ainda existe após delete()!");
                
                // Tentar exclusão forçada via Query Builder
                $this->info("🔨 Tentando exclusão forçada via Query Builder...");
                $forceDeleted = DB::table('proxy_rules')->where('id', $testProxy->id)->delete();
                $this->info("🔨 Query Builder delete retornou: {$forceDeleted}");
                
                // Verificar novamente
                $stillExistsAfterForce = ProxyRule::find($testProxy->id);
                if ($stillExistsAfterForce) {
                    $this->error("❌ ERRO CRÍTICO: Proxy ainda existe mesmo após Query Builder!");
                } else {
                    $this->info("✅ Exclusão forçada funcionou!");
                }
            } else {
                $this->info("✅ Exclusão via Eloquent funcionou perfeitamente!");
            }
            
            $this->info("📊 Total final: " . ProxyRule::count());
            
        } catch (\Exception $e) {
            $this->error("❌ ERRO na exclusão: " . $e->getMessage());
            $this->error("📍 Arquivo: " . $e->getFile() . " linha " . $e->getLine());
        }
    }
}
