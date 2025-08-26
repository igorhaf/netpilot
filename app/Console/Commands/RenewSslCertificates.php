<?php

namespace App\Console\Commands;

use App\Models\SslCertificate;
use App\Services\LetsEncryptService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class RenewSslCertificates extends Command
{
    protected $signature = 'ssl:renew {--force : Force renewal of all certificates} {--dry-run : Show what would be renewed without actually doing it}';
    protected $description = 'Renew SSL certificates that are expiring soon';

    public function __construct(
        private LetsEncryptService $letsEncryptService
    ) {
        parent::__construct();
    }

    public function handle()
    {
        $this->info('🔐 Iniciando renovação de certificados SSL...');

        $query = SslCertificate::where('auto_renew', true);

        if ($this->option('force')) {
            $this->warn('⚠️  Modo forçado: renovando todos os certificados');
            $certificates = $query->get();
        } else {
            $certificates = $query->where('status', 'expiring')->get();
        }

        if ($certificates->isEmpty()) {
            $this->info('✅ Nenhum certificado precisa ser renovado');
            return 0;
        }

        $this->info("📋 Encontrados {$certificates->count()} certificado(s) para renovação");

        $renewed = 0;
        $failed = 0;
        $skipped = 0;

        foreach ($certificates as $certificate) {
            $this->line("🔍 Processando: {$certificate->domain_name}");

            if ($this->option('dry-run')) {
                $this->info("   📝 [DRY-RUN] Seria renovado: {$certificate->domain_name}");
                $skipped++;
                continue;
            }

            try {
                $this->info("   🔄 Renovando certificado para {$certificate->domain_name}...");
                
                $result = $this->letsEncryptService->renewCertificate($certificate);
                
                if ($result['success']) {
                    $this->info("   ✅ Certificado renovado com sucesso: {$certificate->domain_name}");
                    $renewed++;
                } else {
                    $this->error("   ❌ Falha na renovação: {$certificate->domain_name} - {$result['error']}");
                    $failed++;
                }

            } catch (\Exception $e) {
                $this->error("   ❌ Erro na renovação: {$certificate->domain_name} - {$e->getMessage()}");
                $failed++;
                
                Log::error('SSL certificate renewal failed', [
                    'certificate_id' => $certificate->id,
                    'domain_name' => $certificate->domain_name,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        // Summary
        $this->newLine();
        $this->info('📊 Resumo da Renovação:');
        $this->table(
            ['Status', 'Quantidade'],
            [
                ['✅ Renovados', $renewed],
                ['❌ Falharam', $failed],
                ['⏭️  Pulados (dry-run)', $skipped],
            ]
        );

        if ($failed > 0) {
            $this->warn("⚠️  {$failed} certificado(s) falharam na renovação. Verifique os logs para mais detalhes.");
            return 1;
        }

        $this->info('🎉 Renovação de certificados concluída com sucesso!');
        return 0;
    }
}
