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
        $this->command->info('🌱 Populando NetPilot com dados reais...');

        // Limpar dados existentes
        $this->command->info('🧹 Limpando dados existentes...');
        DeploymentLog::truncate();
        SslCertificate::truncate();
        ProxyRule::truncate();
        RedirectRule::truncate();
        Domain::truncate();

        // Criar domínios reais
        $this->command->info('🌐 Criando domínios...');

        $domain1 = Domain::create([
            'name' => 'app.local',
            'description' => 'Aplicação principal do sistema',
            'is_active' => true,
            'auto_ssl' => true,
            'dns_records' => [
                'A' => '192.168.1.100',
                'CNAME' => 'www.app.local'
            ]
        ]);

        $domain2 = Domain::create([
            'name' => 'api.local',
            'description' => 'API do sistema',
            'is_active' => true,
            'auto_ssl' => true,
            'dns_records' => [
                'A' => '192.168.1.100'
            ]
        ]);

        $domain3 = Domain::create([
            'name' => 'dashboard.local',
            'description' => 'Dashboard administrativo',
            'is_active' => true,
            'auto_ssl' => false,
            'dns_records' => [
                'A' => '192.168.1.100'
            ]
        ]);

        $domain4 = Domain::create([
            'name' => 'staging.local',
            'description' => 'Ambiente de homologação',
            'is_active' => false,
            'auto_ssl' => true,
            'dns_records' => [
                'A' => '192.168.1.101'
            ]
        ]);

        // Criar regras de proxy reais
        $this->command->info('🔄 Criando regras de proxy...');

        ProxyRule::create([
            'domain_id' => $domain1->id,
            'source_host' => 'app.local',
            'source_port' => '80',
            'target_host' => 'localhost',
            'target_port' => '3000',
            'protocol' => 'http',
            'priority' => 100,
            'is_active' => true,
            'headers' => [
                'X-Forwarded-Proto' => '$scheme',
                'X-Real-IP' => '$remote_addr'
            ],
            'nginx_config' => 'server { listen 80; server_name app.local; location / { proxy_pass http://localhost:3000; } }'
        ]);

        ProxyRule::create([
            'domain_id' => $domain2->id,
            'source_host' => 'api.local',
            'source_port' => '80',
            'target_host' => 'localhost',
            'target_port' => '8080',
            'protocol' => 'http',
            'priority' => 200,
            'is_active' => true,
            'headers' => [
                'X-API-Version' => 'v1',
                'X-Request-ID' => '$request_id'
            ],
            'nginx_config' => 'server { listen 80; server_name api.local; location / { proxy_pass http://localhost:8080; } }'
        ]);

        ProxyRule::create([
            'domain_id' => $domain3->id,
            'source_host' => 'dashboard.local',
            'source_port' => '80',
            'target_host' => 'localhost',
            'target_port' => '9000',
            'protocol' => 'http',
            'priority' => 150,
            'is_active' => true,
            'headers' => null,
            'nginx_config' => 'server { listen 80; server_name dashboard.local; location / { proxy_pass http://localhost:9000; } }'
        ]);

        ProxyRule::create([
            'domain_id' => $domain4->id,
            'source_host' => 'staging.local',
            'source_port' => '80',
            'target_host' => 'localhost',
            'target_port' => '4000',
            'protocol' => 'http',
            'priority' => 300,
            'is_active' => false,
            'headers' => [
                'X-Environment' => 'staging'
            ],
            'nginx_config' => 'server { listen 80; server_name staging.local; location / { proxy_pass http://localhost:4000; } }'
        ]);

        // Criar certificados SSL reais
        $this->command->info('🔐 Criando certificados SSL...');

        SslCertificate::create([
            'domain_id' => $domain1->id,
            'domain_name' => 'app.local',
            'san_domains' => ['www.app.local', 'admin.app.local'],
            'status' => 'valid',
            'certificate_path' => '/etc/letsencrypt/live/app.local/cert.pem',
            'private_key_path' => '/etc/letsencrypt/live/app.local/privkey.pem',
            'chain_path' => '/etc/letsencrypt/live/app.local/chain.pem',
            'issued_at' => now()->subDays(30),
            'expires_at' => now()->addDays(60),
            'auto_renew' => true,
            'renewal_days_before' => 30,
            'last_error' => null
        ]);

        SslCertificate::create([
            'domain_id' => $domain2->id,
            'domain_name' => 'api.local',
            'san_domains' => null,
            'status' => 'expiring',
            'certificate_path' => '/etc/letsencrypt/live/api.local/cert.pem',
            'private_key_path' => '/etc/letsencrypt/live/api.local/privkey.pem',
            'chain_path' => '/etc/letsencrypt/live/api.local/chain.pem',
            'issued_at' => now()->subDays(75),
            'expires_at' => now()->addDays(15),
            'auto_renew' => true,
            'renewal_days_before' => 30,
            'last_error' => null
        ]);

        SslCertificate::create([
            'domain_id' => $domain4->id,
            'domain_name' => 'staging.local',
            'san_domains' => ['test.staging.local'],
            'status' => 'failed',
            'certificate_path' => null,
            'private_key_path' => null,
            'chain_path' => null,
            'issued_at' => null,
            'expires_at' => null,
            'auto_renew' => true,
            'renewal_days_before' => 30,
            'last_error' => 'DNS challenge failed: domain not accessible'
        ]);

        // Criar redirects reais
        $this->command->info('↩️ Criando regras de redirect...');

        RedirectRule::create([
            'domain_id' => $domain1->id,
            'source_pattern' => '/old-path',
            'target_url' => 'https://app.local/new-path',
            'redirect_type' => 301,
            'priority' => 100,
            'is_active' => true,
            'preserve_query' => true
        ]);

        RedirectRule::create([
            'domain_id' => $domain2->id,
            'source_pattern' => '/v1/deprecated',
            'target_url' => 'https://api.local/v2/new-endpoint',
            'redirect_type' => 302,
            'priority' => 200,
            'is_active' => true,
            'preserve_query' => true
        ]);

        // Criar logs de deployment reais
        $this->command->info('📝 Criando logs de deployment...');

        DeploymentLog::create([
            'type' => 'nginx',
            'action' => 'deploy',
            'status' => 'success',
            'payload' => [
                'rules_count' => 4,
                'domains' => ['app.local', 'api.local', 'dashboard.local', 'staging.local']
            ],
            'output' => 'nginx: configuration file /etc/nginx/nginx.conf test is successful',
            'error' => null,
            'started_at' => now()->subMinutes(30),
            'completed_at' => now()->subMinutes(29)
        ]);

        DeploymentLog::create([
            'type' => 'ssl_renewal',
            'action' => 'renew',
            'status' => 'success',
            'payload' => [
                'certificate_id' => 1,
                'domain_name' => 'app.local'
            ],
            'output' => 'Certificate renewed successfully for app.local',
            'error' => null,
            'started_at' => now()->subHours(2),
            'completed_at' => now()->subHours(2)->addMinutes(3)
        ]);

        DeploymentLog::create([
            'type' => 'ssl_renewal',
            'action' => 'issue',
            'status' => 'failed',
            'payload' => [
                'certificate_id' => 3,
                'domain_name' => 'staging.local'
            ],
            'output' => null,
            'error' => 'DNS challenge failed: domain not accessible from Let\'s Encrypt servers',
            'started_at' => now()->subHours(6),
            'completed_at' => now()->subHours(6)->addMinutes(1)
        ]);

        DeploymentLog::create([
            'type' => 'traefik',
            'action' => 'deploy',
            'status' => 'success',
            'payload' => [
                'certificates_count' => 2,
                'valid_certificates' => 1,
                'expiring_certificates' => 1
            ],
            'output' => 'Traefik configuration deployed successfully',
            'error' => null,
            'started_at' => now()->subHours(1),
            'completed_at' => now()->subHours(1)->addSeconds(45)
        ]);

        DeploymentLog::create([
            'type' => 'nginx',
            'action' => 'deploy',
            'status' => 'running',
            'payload' => [
                'rules_count' => 4,
                'trigger' => 'automatic'
            ],
            'output' => null,
            'error' => null,
            'started_at' => now()->subMinutes(2),
            'completed_at' => null
        ]);

        $this->command->info('✅ NetPilot populado com sucesso!');
        $this->command->info('📊 Dados criados:');
        $this->command->info('   - 4 domínios');
        $this->command->info('   - 4 regras de proxy');
        $this->command->info('   - 3 certificados SSL');
        $this->command->info('   - 2 regras de redirect');
        $this->command->info('   - 5 logs de deployment');
    }
}
