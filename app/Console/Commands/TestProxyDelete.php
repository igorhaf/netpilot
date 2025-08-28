<?php

namespace App\Console\Commands;

use App\Models\ProxyRule;
use Illuminate\Console\Command;

class TestProxyDelete extends Command
{
    protected $signature = 'proxy:test-delete {id}';
    protected $description = 'Test proxy rule deletion';

    public function handle()
    {
        $id = $this->argument('id');
        
        $this->info("Tentando deletar proxy rule ID: {$id}");
        
        // Verificar se existe
        $rule = ProxyRule::find($id);
        if (!$rule) {
            $this->error("Proxy rule com ID {$id} não encontrado");
            return 1;
        }
        
        $this->info("Encontrado: {$rule->source_host} -> {$rule->target_host}:{$rule->target_port}");
        $this->info("Total de regras antes: " . ProxyRule::count());
        
        try {
            // Tentar deletar usando Eloquent
            $deleted = $rule->delete();
            $this->info("Delete retornou: " . ($deleted ? 'true' : 'false'));
            
            // Verificar se ainda existe
            $stillExists = ProxyRule::find($id);
            if ($stillExists) {
                $this->error("PROBLEMA: Regra ainda existe após delete()");
            } else {
                $this->info("Sucesso: Regra foi deletada");
            }
            
            $this->info("Total de regras depois: " . ProxyRule::count());
            
        } catch (\Exception $e) {
            $this->error("Erro ao deletar: " . $e->getMessage());
            $this->error("Trace: " . $e->getTraceAsString());
        }
        
        return 0;
    }
}
