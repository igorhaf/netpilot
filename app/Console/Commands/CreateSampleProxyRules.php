<?php

namespace App\Console\Commands;

use App\Models\Domain;
use App\Models\ProxyRule;
use Illuminate\Console\Command;

class CreateSampleProxyRules extends Command
{
    protected $signature = 'proxy:create-samples';
    protected $description = 'Cria regras de proxy de exemplo para teste';

    public function handle()
    {
        $this->info('🧪 Criando regras de proxy de exemplo...');

        // Verificar se já existem regras
        if (ProxyRule::count() > 0) {
            $this->warn('⚠️ Já existem regras de proxy no sistema!');
            if (!$this->confirm('Deseja continuar e criar regras adicionais?')) {
                $this->info('❌ Operação cancelada pelo usuário.');
                return 0;
            }
        }

        // Verificar se existem domínios
        $domains = Domain::where('is_active', true)->get();
        if ($domains->isEmpty()) {
            $this->error('❌ Não há domínios ativos no sistema!');
            $this->line('💡 Crie um domínio primeiro usando: php artisan domain:create-sample');
            return 1;
        }

        $this->info("📊 Domínios disponíveis: {$domains->count()}");

        // Criar regras de exemplo
        $sampleRules = [
            [
                'domain_id' => $domains->first()->id,
                'source_host' => 'framily.space',
                'source_port' => '80',
                'target_host' => 'localhost',
                'target_port' => '8484',
                'protocol' => 'http',
                'priority' => 100,
                'is_active' => true,
                'description' => 'Proxy principal para aplicação Laravel'
            ],
            [
                'domain_id' => $domains->first()->id,
                'source_host' => 'api.framily.space',
                'source_port' => '80',
                'target_host' => 'localhost',
                'target_port' => '3000',
                'protocol' => 'http',
                'priority' => 90,
                'is_active' => true,
                'description' => 'Proxy para API externa'
            ],
            [
                'domain_id' => $domains->first()->id,
                'source_host' => 'admin.framily.space',
                'source_port' => '443',
                'target_host' => 'localhost',
                'target_port' => '8080',
                'protocol' => 'https',
                'priority' => 80,
                'is_active' => false,
                'description' => 'Proxy para painel administrativo (inativo)'
            ]
        ];

        $createdCount = 0;
        foreach ($sampleRules as $ruleData) {
            try {
                $rule = ProxyRule::create($ruleData);
                
                // Gerar configuração Nginx
                $rule->update([
                    'nginx_config' => $rule->generateNginxConfig()
                ]);
                
                $this->info("✅ Regra criada: {$rule->source_host}:{$rule->source_port} → {$rule->target_host}:{$rule->target_port}");
                $createdCount++;
                
            } catch (\Exception $e) {
                $this->error("❌ Erro ao criar regra {$ruleData['source_host']}: " . $e->getMessage());
            }
        }

        $this->info('');
        $this->info("🎉 {$createdCount} regras de proxy criadas com sucesso!");
        
        // Mostrar estatísticas
        $total = ProxyRule::count();
        $active = ProxyRule::where('is_active', true)->count();
        $inactive = ProxyRule::where('is_active', false)->count();
        
        $this->line('');
        $this->line('📊 Estatísticas atuais:');
        $this->line("   • Total: {$total}");
        $this->line("   • Ativas: {$active}");
        $this->line("   • Inativas: {$inactive}");
        
        $this->line('');
        $this->line('💡 Para aplicar no Traefik:');
        $this->line('   php artisan traefik:apply-config');
        
        $this->line('');
        $this->line('🌐 Acesse a página de proxy para ver as regras criadas!');
        
        return 0;
    }
}
