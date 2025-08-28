<?php

namespace App\Console\Commands;

use App\Models\ProxyRule;
use App\Models\Domain;
use Illuminate\Console\Command;

class TestProxyOperations extends Command
{
    protected $signature = 'proxy:test-operations';
    protected $description = 'Test proxy rule CRUD operations';

    public function handle()
    {
        $this->info("=== Testando operações de Proxy Rules ===");
        
        // Verificar se há domínios
        $domain = Domain::first();
        if (!$domain) {
            $this->error("Nenhum domínio encontrado. Criando um domínio de teste...");
            $domain = Domain::create([
                'name' => 'test.local',
                'description' => 'Domínio de teste',
                'is_active' => true,
                'auto_ssl' => false,
            ]);
            $this->info("Domínio criado: {$domain->name}");
        }
        
        $this->info("Usando domínio: {$domain->name} (ID: {$domain->id})");
        
        // Contar regras antes
        $countBefore = ProxyRule::count();
        $this->info("Total de proxy rules antes: {$countBefore}");
        
        // Criar uma regra de teste
        $this->info("Criando regra de teste...");
        $rule = ProxyRule::create([
            'domain_id' => $domain->id,
            'source_host' => 'test.local',
            'source_port' => '8080',
            'target_host' => 'localhost',
            'target_port' => '3000',
            'protocol' => 'http',
            'priority' => 100,
            'is_active' => true,
        ]);
        
        $this->info("Regra criada - ID: {$rule->id}");
        
        // Contar regras após criação
        $countAfterCreate = ProxyRule::count();
        $this->info("Total de proxy rules após criação: {$countAfterCreate}");
        
        // Tentar deletar
        $this->info("Tentando deletar regra...");
        try {
            $deleted = $rule->delete();
            $this->info("Delete retornou: " . ($deleted ? 'true' : 'false'));
            
            // Verificar se ainda existe
            $stillExists = ProxyRule::find($rule->id);
            if ($stillExists) {
                $this->error("PROBLEMA: Regra ainda existe após delete()");
                
                // Tentar forçar com query builder
                $this->info("Tentando forçar exclusão com query builder...");
                $forceDeleted = \DB::table('proxy_rules')->where('id', $rule->id)->delete();
                $this->info("Query builder delete retornou: {$forceDeleted}");
                
                // Verificar novamente
                $stillExists2 = ProxyRule::find($rule->id);
                if ($stillExists2) {
                    $this->error("AINDA EXISTE após query builder delete!");
                } else {
                    $this->info("Sucesso com query builder");
                }
            } else {
                $this->info("Sucesso: Regra foi deletada com Eloquent");
            }
            
            // Contar regras após exclusão
            $countAfterDelete = ProxyRule::count();
            $this->info("Total de proxy rules após exclusão: {$countAfterDelete}");
            
            if ($countAfterDelete < $countAfterCreate) {
                $this->info("✅ Exclusão funcionou - contagem diminuiu");
            } else {
                $this->error("❌ Exclusão falhou - contagem não diminuiu");
            }
            
        } catch (\Exception $e) {
            $this->error("Erro ao deletar: " . $e->getMessage());
        }
        
        return 0;
    }
}
