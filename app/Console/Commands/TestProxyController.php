<?php

namespace App\Console\Commands;

use App\Models\ProxyRule;
use App\Http\Controllers\ProxyController;
use Illuminate\Console\Command;
use Illuminate\Http\Request;

class TestProxyController extends Command
{
    protected $signature = 'proxy:test-controller';
    protected $description = 'Test ProxyController destroy method directly';

    public function handle()
    {
        $this->info("🔍 Testando ProxyController::destroy diretamente");
        
        // Pegar um proxy para testar
        $proxy = ProxyRule::first();
        if (!$proxy) {
            $this->error("❌ Nenhum proxy encontrado!");
            return 1;
        }
        
        $this->info("📊 Testando exclusão do proxy ID: {$proxy->id}");
        $this->info("Total antes: " . ProxyRule::count());
        
        try {
            // Criar instância do controller
            $controller = new ProxyController();
            
            // Simular request
            $request = Request::create('/proxy/' . $proxy->id, 'DELETE');
            
            // Chamar método destroy diretamente
            $this->info("🗑️ Chamando ProxyController::destroy...");
            $response = $controller->destroy($proxy);
            
            $this->info("✅ Controller retornou: " . get_class($response));
            
            // Verificar se foi deletado
            $stillExists = ProxyRule::find($proxy->id);
            $this->info("Proxy ainda existe: " . ($stillExists ? 'SIM' : 'NÃO'));
            $this->info("Total depois: " . ProxyRule::count());
            
            if (!$stillExists) {
                $this->info("🎉 Exclusão funcionou via controller!");
            } else {
                $this->error("❌ Exclusão falhou via controller!");
            }
            
        } catch (\Exception $e) {
            $this->error("❌ Erro ao testar controller: " . $e->getMessage());
            $this->error("Arquivo: " . $e->getFile() . " linha " . $e->getLine());
        }
        
        return 0;
    }
}
