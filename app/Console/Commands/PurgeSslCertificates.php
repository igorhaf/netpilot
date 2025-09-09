<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use App\Models\SslCertificate;
use App\Models\Domain;
use App\Services\LetsEncryptService;
use App\Services\TraefikService;

class PurgeSslCertificates extends Command
{
    protected $signature = 'ssl:purge {--force : Run without confirmation in production} {--configs : Also remove Traefik dynamic configs for domains}';

    protected $description = 'Revoga e remove todos os certificados SSL e limpa o acme.json para começar do zero';

    public function handle(LetsEncryptService $lets, TraefikService $traefik)
    {
        if (app()->environment('production') && !$this->option('force')) {
            $this->error('Este comando executa ações destrutivas em produção. Use --force para continuar.');
            return Command::FAILURE;
        }

        if (!$this->confirm('Isso irá revogar/remover TODOS os certificados e limpar o acme.json. Deseja continuar?')) {
            return Command::SUCCESS;
        }

        $this->info('1) Revogando certificados ativos...');
        $revoked = 0; $errors = 0;
        SslCertificate::query()->whereIn('status', ['valid', 'issued', 'pending'])
            ->chunkById(100, function ($chunk) use ($lets, &$revoked, &$errors) {
                foreach ($chunk as $cert) {
                    try {
                        $lets->revokeCertificate($cert);
                        $revoked++;
                    } catch (\Throwable $e) {
                        $errors++;
                        \Log::warning('Falha ao revogar certificado', [
                            'id' => $cert->id,
                            'domain' => $cert->domain_name,
                            'error' => $e->getMessage(),
                        ]);
                        $this->warn(" - Falha ao revogar {$cert->domain_name}: {$e->getMessage()}");
                    }
                }
            });
        $this->line("Revogados: {$revoked}; Falhas: {$errors}");

        $this->info('2) Removendo diretórios de certificados...');
        $certsPath = storage_path('certs');
        $acmePath = storage_path('letsencrypt');
        try {
            if (File::exists($certsPath)) {
                File::deleteDirectory($certsPath);
            }
            File::makeDirectory($certsPath, 0755, true);
            $this->line(" - Limpo: {$certsPath}");
        } catch (\Throwable $e) {
            $this->warn(" - Falha ao limpar {$certsPath}: {$e->getMessage()}");
        }

        try {
            if (File::exists($acmePath)) {
                File::deleteDirectory($acmePath);
            }
            File::makeDirectory($acmePath, 0755, true);
            $this->line(" - Limpo: {$acmePath}");
        } catch (\Throwable $e) {
            $this->warn(" - Falha ao limpar {$acmePath}: {$e->getMessage()}");
        }

        $this->info('3) Resetando traefik/acme.json...');
        $acmeFile = base_path('traefik/acme.json');
        try {
            File::put($acmeFile, json_encode(new \stdClass()));
            @chmod($acmeFile, 0600);
            $this->line(" - Resetado: {$acmeFile}");
        } catch (\Throwable $e) {
            $this->warn(" - Não foi possível escrever em {$acmeFile}: {$e->getMessage()}");
        }

        if ($this->option('configs')) {
            $this->info('4) Removendo configs dinâmicas do Traefik para domínios...');
            Domain::query()->chunkById(100, function ($chunk) use ($traefik) {
                foreach ($chunk as $domain) {
                    try { $traefik->removeDomain($domain); } catch (\Throwable $e) { /* ignore */ }
                }
            });
        }

        $this->info('5) Limpando registros da base (ssl_certificates)...');
        try {
            \DB::table('ssl_certificates')->delete();
        } catch (\Throwable $e) {
            $this->warn(' - Não foi possível limpar a tabela ssl_certificates: ' . $e->getMessage());
        }

        $this->info('Concluído. O sistema está limpo para novos cadastros de SSL.');
        return Command::SUCCESS;
    }
}
