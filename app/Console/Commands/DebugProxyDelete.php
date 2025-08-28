<?php

namespace App\Console\Commands;

use App\Models\ProxyRule;
use Illuminate\Console\Command;

class DebugProxyDelete extends Command
{
    protected $signature = 'proxy:debug-delete {id}';
    protected $description = 'Debug proxy deletion';

    public function handle()
    {
        $id = $this->argument('id');
        
        $this->info("🔍 Debugando exclusão do proxy ID: {$id}");
        
        // Verificar se existe
        $proxy = ProxyRule::find($id);
        if (!$proxy) {
            $this->error("❌ Proxy com ID {$id} não encontrado!");
            return;
        }
        
        $this->info("✅ Proxy encontrado: {$proxy->source_host}");
        $this->info("📊 Total antes: " . ProxyRule::count());
        
        try {
            // Tentar deletar
            $deleted = $proxy->delete();
            $this->info("🗑️ Delete retornou: " . ($deleted ? 'true' : 'false'));
            
            // Verificar se ainda existe
            $stillExists = ProxyRule::find($id);
            if ($stillExists) {
                $this->error("❌ Proxy ainda existe após delete()!");
            } else {
                $this->info("✅ Proxy foi removido com sucesso");
            }
            
            $this->info("📊 Total depois: " . ProxyRule::count());
            
        } catch (\Exception $e) {
            $this->error("❌ Erro ao deletar: " . $e->getMessage());
            $this->error("Stack trace: " . $e->getTraceAsString());
        }
    }
}
