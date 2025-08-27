<?php

namespace App\Console\Commands;

use App\Models\SslCertificate;
use App\Models\Domain;
use Illuminate\Console\Command;

class CheckSslCertificates extends Command
{
    protected $signature = 'ssl:check';
    protected $description = 'Check SSL certificates status and data';

    public function handle()
    {
        $this->info('🔍 Verificando certificados SSL...');
        
        // Verificar se há domínios
        $domainsCount = Domain::count();
        $this->info("📊 Total de domínios: {$domainsCount}");
        
        if ($domainsCount > 0) {
            $domains = Domain::all();
            foreach ($domains as $domain) {
                $this->line("  - {$domain->name} (auto_ssl: " . ($domain->auto_ssl ? 'sim' : 'não') . ")");
            }
        }
        
        // Verificar certificados SSL
        $certificatesCount = SslCertificate::count();
        $this->info("🔐 Total de certificados SSL: {$certificatesCount}");
        
        if ($certificatesCount > 0) {
            $certificates = SslCertificate::with('domain')->get();
            foreach ($certificates as $cert) {
                $this->line("  - ID: {$cert->id}, Domínio: {$cert->domain_name}, Status: {$cert->status}");
                if ($cert->domain) {
                    $this->line("    Domínio relacionado: {$cert->domain->name}");
                }
                if ($cert->expires_at) {
                    $this->line("    Expira em: {$cert->expires_at} (há " . $cert->expires_at->diffForHumans() . ")");
                }
            }
        } else {
            $this->warn('⚠️  Nenhum certificado SSL encontrado!');
            
            // Verificar se há domínios com auto_ssl habilitado
            $autoSslDomains = Domain::where('auto_ssl', true)->get();
            if ($autoSslDomains->count() > 0) {
                $this->info('📝 Domínios com auto_ssl habilitado (devem ter certificados):');
                foreach ($autoSslDomains as $domain) {
                    $this->line("  - {$domain->name}");
                }
                
                $this->warn('💡 Execute: php artisan tinker');
                $this->warn('💡 Depois: App\Jobs\CreateSslCertificateJob::dispatchSync(App\Models\SslCertificate::create([...]))');
            }
        }
        
        return 0;
    }
}
