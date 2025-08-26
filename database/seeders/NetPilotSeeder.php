<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Domain;
use App\Models\ProxyRule;
use App\Models\SslCertificate;
use App\Models\DeploymentLog;
use App\Models\RedirectRule;

class NetPilotSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('🌱 Inicializando NetPilot...');

        // Limpar dados existentes
        $this->command->info('🧹 Limpando dados existentes...');
        DeploymentLog::truncate();
        SslCertificate::truncate();
        ProxyRule::truncate();
        RedirectRule::truncate();
        Domain::truncate();

        $this->command->info('✅ NetPilot inicializado com sucesso!');
        $this->command->info('📊 Banco de dados limpo e pronto para uso.');
    }
}
