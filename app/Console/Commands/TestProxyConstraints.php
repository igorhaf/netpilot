<?php

namespace App\Console\Commands;

use App\Models\ProxyRule;
use App\Models\Domain;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class TestProxyConstraints extends Command
{
    protected $signature = 'proxy:test-constraints';
    protected $description = 'Test foreign key constraints for proxy rules';

    public function handle()
    {
        $this->info("🔍 Testando constraints de foreign key para proxy rules");
        
        // Verificar estrutura da tabela
        $this->info("📋 Verificando estrutura da tabela...");
        $columns = Schema::getColumnListing('proxy_rules');
        $this->line("Colunas: " . implode(', ', $columns));
        
        // Verificar foreign keys (SQLite)
        $this->info("🔗 Verificando foreign keys...");
        try {
            $foreignKeys = DB::select("PRAGMA foreign_key_list(proxy_rules)");
            if (empty($foreignKeys)) {
                $this->warn("⚠️ Nenhuma foreign key encontrada");
            } else {
                foreach ($foreignKeys as $fk) {
                    $this->line("FK: " . ($fk->id ?? 'N/A'));
                    $this->line("  - Tabela: " . ($fk->table ?? 'N/A'));
                    $this->line("  - Coluna: " . ($fk->from ?? 'N/A'));
                    $this->line("  - Referência: " . ($fk->to ?? 'N/A'));
                    $this->line("  - onDelete: " . ($fk->on_delete ?? 'N/A'));
                    $this->line("  - onUpdate: " . ($fk->on_update ?? 'N/A'));
                }
            }
        } catch (\Exception $e) {
            $this->warn("⚠️ Erro ao verificar foreign keys: " . $e->getMessage());
        }
        
        // Verificar dados
        $this->info("📊 Verificando dados...");
        $proxyCount = ProxyRule::count();
        $domainCount = Domain::count();
        $this->line("Total proxies: {$proxyCount}");
        $this->line("Total domínios: {$domainCount}");
        
        // Verificar se todos os proxies têm domínios válidos
        $this->info("🔍 Verificando integridade dos dados...");
        $invalidProxies = ProxyRule::whereNotExists(function($query) {
            $query->select(DB::raw(1))
                  ->from('domains')
                  ->whereRaw('domains.id = proxy_rules.domain_id');
        })->get();
        
        if ($invalidProxies->isEmpty()) {
            $this->info("✅ Todos os proxies têm domínios válidos");
        } else {
            $this->warn("⚠️ Proxies com domínios inválidos:");
            foreach ($invalidProxies as $proxy) {
                $this->line("  - ID: {$proxy->id}, Domain ID: {$proxy->domain_id}");
            }
        }
        
        // Testar exclusão direta no banco
        $this->info("🗑️ Testando exclusão direta no banco...");
        $testProxy = ProxyRule::first();
        if ($testProxy) {
            $this->line("Testando exclusão do proxy ID: {$testProxy->id}");
            
            try {
                // Tentar exclusão via SQL direto
                $deleted = DB::table('proxy_rules')->where('id', $testProxy->id)->delete();
                $this->line("SQL DELETE retornou: {$deleted}");
                
                // Verificar se foi deletado
                $stillExists = ProxyRule::find($testProxy->id);
                $this->line("Ainda existe: " . ($stillExists ? 'SIM' : 'NÃO'));
                
                // Se foi deletado, recriar para não perder o teste
                if (!$stillExists) {
                    $this->line("Recriando proxy para manter integridade dos dados...");
                    ProxyRule::create([
                        'domain_id' => $testProxy->domain_id,
                        'source_host' => $testProxy->source_host,
                        'source_port' => $testProxy->source_port,
                        'target_host' => $testProxy->target_host,
                        'target_port' => $testProxy->target_port,
                        'protocol' => $testProxy->protocol,
                        'priority' => $testProxy->priority,
                        'is_active' => $testProxy->is_active,
                    ]);
                }
            } catch (\Exception $e) {
                $this->error("❌ Erro na exclusão: " . $e->getMessage());
            }
        }
        
        return 0;
    }
}
