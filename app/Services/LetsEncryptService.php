<?php

namespace App\Services;

use App\Models\SslCertificate;
use App\Models\DeploymentLog;
use App\Models\Domain;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Process;

class LetsEncryptService
{
    private string $acmePath;
    private string $certificatesPath;

    public function __construct(
        private NginxService $nginx,
        private TraefikService $traefik
    ) {
        $this->acmePath = config('letsencrypt.acme_path', '/etc/letsencrypt');
        $this->certificatesPath = config('letsencrypt.certificates_path', '/etc/letsencrypt/live');
    }

    public function issueCertificate(SslCertificate $certificate): array
    {
        $mainLog = null;
        
        try {
            // Log inicial da operação
            $mainLog = DeploymentLog::create([
                'type' => 'ssl_renewal',
                'action' => 'issue_certificate',
                'status' => 'running',
                'payload' => [
                    'certificate_id' => $certificate->id,
                    'domain_name' => $certificate->domain_name,
                    'san_domains' => $certificate->san_domains,
                    'environment' => app()->environment(),
                ],
                'started_at' => now(),
            ]);

            // Fase 1: Validação do domínio
            $this->logSslPhase($certificate, 'domain_validation', 'running', 'Iniciando validação do domínio...');
            
            if (!$this->validateDomain($certificate->domain_name)) {
                throw new \Exception("Domínio {$certificate->domain_name} não é válido ou não está acessível");
            }
            
            $this->logSslPhase($certificate, 'domain_validation', 'success', 'Domínio validado com sucesso');

            // Fase 2: Verificação de portas
            $this->logSslPhase($certificate, 'port_check', 'running', 'Verificando disponibilidade das portas 80 e 443...');
            
            if (!$this->checkPorts($certificate->domain_name)) {
                throw new \Exception("Portas 80 e/ou 443 não estão disponíveis para {$certificate->domain_name}");
            }
            
            $this->logSslPhase($certificate, 'port_check', 'success', 'Portas verificadas e disponíveis');

            // Fase 3: Preparação do ambiente
            $this->logSslPhase($certificate, 'environment_prep', 'running', 'Preparando ambiente para emissão do certificado...');
            
            $this->prepareEnvironment($certificate);
            
            $this->logSslPhase($certificate, 'environment_prep', 'success', 'Ambiente preparado com sucesso');

            // Fase 4: Emissão do certificado
            $this->logSslPhase($certificate, 'certificate_issuance', 'running', 'Emitindo certificado SSL...');
            
            if (app()->environment('production')) {
                $result = $this->issueCertificateWithCertbot($certificate);
            } else {
                $result = $this->simulateCertificateIssuance($certificate);
            }
            
            $this->logSslPhase($certificate, 'certificate_issuance', 'success', 'Certificado emitido com sucesso');

            // Fase 5: Aplicação do certificado
            $this->logSslPhase($certificate, 'certificate_application', 'running', 'Aplicando certificado ao servidor...');
            
            $this->applyCertificateToServer($certificate, $result);
            
            $this->logSslPhase($certificate, 'certificate_application', 'success', 'Certificado aplicado com sucesso');

            // Fase 6: Verificação final
            $this->logSslPhase($certificate, 'final_verification', 'running', 'Verificando aplicação do certificado...');
            
            $verificationResult = $this->verifyCertificateApplication($certificate);
            
            if (!$verificationResult['valid']) {
                throw new \Exception('Falha na verificação final: ' . $verificationResult['error']);
            }
            
            $this->logSslPhase($certificate, 'final_verification', 'success', 'Verificação final concluída com sucesso');

            // Atualizar status do certificado
            $certificate->update([
                'status' => 'valid',
                'issued_at' => now(),
                'expires_at' => now()->addDays(90),
                'certificate_path' => $result['cert_path'] ?? null,
                'private_key_path' => $result['key_path'] ?? null,
                'chain_path' => $result['chain_path'] ?? null,
                'last_error' => null,
            ]);

            // Log de sucesso principal
            $mainLog->markAsSuccess("Certificado SSL emitido e aplicado com sucesso para {$certificate->domain_name}");

            return [
                'success' => true,
                'message' => 'Certificate issued and applied successfully',
                'certificate' => $certificate,
                'paths' => $result,
                'verification' => $verificationResult,
            ];

        } catch (\Exception $e) {
            if ($mainLog) {
                $mainLog->markAsFailed($e->getMessage());
            }
            
            $certificate->update([
                'status' => 'failed',
                'last_error' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    private function logSslPhase(SslCertificate $certificate, string $phase, string $status, string $message): void
    {
        DeploymentLog::create([
                'type' => 'ssl_renewal',
            'action' => $phase,
            'status' => $status,
                'payload' => [
                    'certificate_id' => $certificate->id,
                    'domain_name' => $certificate->domain_name,
                'phase' => $phase,
                'parent_action' => 'issue_certificate',
            ],
            'output' => $message,
            'started_at' => now(),
            'completed_at' => $status === 'success' ? now() : null,
        ]);
    }

    private function validateDomain(string $domainName): bool
    {
        if (app()->environment('production')) {
            return gethostbyname($domainName) !== $domainName;
        }
        sleep(1);
        return true;
    }

    private function checkPorts(string $domainName): bool
    {
        if (app()->environment('production')) {
            $ports = [80, 443];
            foreach ($ports as $port) {
                $connection = @fsockopen($domainName, $port, $errno, $errstr, 5);
                if (!$connection) {
                    return false;
                }
                fclose($connection);
            }
            return true;
        }
        sleep(1);
        return true;
    }

    private function prepareEnvironment(SslCertificate $certificate): void
    {
        $domainPath = $this->certificatesPath . '/' . $certificate->domain_name;
        
        if (!File::exists($domainPath)) {
            File::makeDirectory($domainPath, 0755, true);
        }
        
        if (app()->environment('production')) {
            if (!is_writable($this->certificatesPath)) {
                throw new \Exception("Diretório {$this->certificatesPath} não tem permissão de escrita");
            }
        }
        sleep(1);
    }

    private function applyCertificateToServer(SslCertificate $certificate, array $result): void
    {
        $edge = config('netpilot.edge', 'nginx');
        $domain = Domain::find($certificate->domain_id);
        if (!$domain) {
            $domain = new Domain([ 'name' => $certificate->domain_name ]);
        }

        if ($edge === 'traefik') {
            $this->traefik->applyDomain($domain, $result);
        } else {
            $this->nginx->applyDomain($domain, $result);
        }
    }

    private function issueCertificateWithCertbot(SslCertificate $certificate): array
    {
        $domainName = $certificate->domain_name;
        $sanDomains = $certificate->san_domains ?? [];
        $allDomains = array_merge([$domainName], $sanDomains);
        
        $domainsParam = '-d ' . implode(' -d ', $allDomains);
        $email = config('letsencrypt.email', 'admin@' . $domainName);
        
        $command = sprintf(
            'certbot certonly --standalone --non-interactive --agree-tos --email %s %s --cert-name %s',
            escapeshellarg($email),
            $domainsParam,
            escapeshellarg($domainName)
        );

        $result = Process::run($command);
        
        if (!$result->successful()) {
            throw new \Exception('Certbot failed: ' . $result->errorOutput());
        }

        $certPath = "/etc/letsencrypt/live/{$domainName}";
        
        return [
            'cert_path' => "{$certPath}/cert.pem",
            'key_path' => "{$certPath}/privkey.pem",
            'chain_path' => "{$certPath}/chain.pem",
            'fullchain_path' => "{$certPath}/fullchain.pem",
            'command' => $command,
            'stdout' => $result->output(),
            'stderr' => $result->errorOutput(),
        ];
    }

    private function simulateCertificateIssuance(SslCertificate $certificate): array
    {
        sleep(3);
        $paths = $this->generateMockCertificateFiles($certificate);
        return $paths;
    }

    private function simulateCertificateRenewal(SslCertificate $certificate): void
    {
        sleep(1);
        $this->generateMockCertificateFiles($certificate);
    }

    private function simulateCertificateRevocation(SslCertificate $certificate): void
    {
        sleep(1);
        $this->removeMockCertificateFiles($certificate);
    }

    private function generateMockCertificateFiles(SslCertificate $certificate): array
    {
        $domainPath = $this->certificatesPath . '/' . $certificate->domain_name;
        
        if (!File::exists($domainPath)) {
            File::makeDirectory($domainPath, 0755, true);
        }

        $certContent = $this->generateMockCertificateContent($certificate);
        $keyContent = $this->generateMockPrivateKeyContent();
        $chainContent = $this->generateMockChainContent();

        File::put($domainPath . '/cert.pem', $certContent);
        File::put($domainPath . '/privkey.pem', $keyContent);
        File::put($domainPath . '/chain.pem', $chainContent);

        return [
            'cert_path' => $domainPath . '/cert.pem',
            'key_path' => $domainPath . '/privkey.pem',
            'chain_path' => $domainPath . '/chain.pem',
        ];
    }

    private function removeMockCertificateFiles(SslCertificate $certificate): void
    {
        if ($certificate->certificate_path && File::exists($certificate->certificate_path)) {
            File::delete($certificate->certificate_path);
        }
        
        if ($certificate->private_key_path && File::exists($certificate->private_key_path)) {
            File::delete($certificate->private_key_path);
        }
        
        if ($certificate->chain_path && File::exists($certificate->chain_path)) {
            File::delete($certificate->chain_path);
        }

        $certificate->update([
            'certificate_path' => null,
            'private_key_path' => null,
            'chain_path' => null,
        ]);
    }

    private function generateMockCertificateContent(SslCertificate $certificate): string
    {
        $domains = array_merge([$certificate->domain_name], $certificate->san_domains ?? []);
        $domainsList = implode(', ', $domains);
        
        return "-----BEGIN CERTIFICATE-----\n" .
               "Mock SSL Certificate for: {$domainsList}\n" .
               "Issued: " . now()->toISOString() . "\n" .
               "Expires: " . now()->addDays(90)->toISOString() . "\n" .
               "Issuer: Let's Encrypt Authority X3\n" .
               "-----END CERTIFICATE-----";
    }

    private function generateMockPrivateKeyContent(): string
    {
        return "-----BEGIN PRIVATE KEY-----\n" .
               "Mock Private Key Content\n" .
               "This is a placeholder for development/testing\n" .
               "-----END PRIVATE KEY-----";
    }

    private function generateMockChainContent(): string
    {
        return "-----BEGIN CERTIFICATE-----\n" .
               "Mock Intermediate Certificate\n" .
               "Let's Encrypt Authority X3\n" .
               "-----END CERTIFICATE-----\n" .
               "-----BEGIN CERTIFICATE-----\n" .
               "Mock Root Certificate\n" .
               "DST Root CA X3\n" .
               "-----END CERTIFICATE-----";
    }

    public function checkCertificateStatus(SslCertificate $certificate): array
    {
        try {
            if (!$certificate->certificate_path || !File::exists($certificate->certificate_path)) {
                return [
                    'valid' => false,
                    'error' => 'Certificate file not found',
                ];
            }

            $certContent = File::get($certificate->certificate_path);
            
            if (strpos($certContent, 'Mock SSL Certificate') === false) {
                return [
                    'valid' => false,
                    'error' => 'Invalid certificate format',
                ];
            }

            return [
                'valid' => true,
                'expires_at' => $certificate->expires_at,
                'days_until_expiry' => $certificate->expires_at ? now()->diffInDays($certificate->expires_at, false) : null,
            ];

        } catch (\Exception $e) {
            return [
                'valid' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    public function getAcmeChallengePath(string $domainName): string
    {
        return $this->acmePath . '/challenges/' . $domainName;
    }

    public function cleanupExpiredCertificates(): array
    {
        $expiredCertificates = SslCertificate::where('status', 'expired')
            ->where('auto_renew', false)
            ->get();

        $cleaned = 0;
        $errors = [];

        foreach ($expiredCertificates as $certificate) {
            try {
                $this->removeMockCertificateFiles($certificate);
                $certificate->delete();
                $cleaned++;
            } catch (\Exception $e) {
                $errors[] = $certificate->domain_name . ': ' . $e->getMessage();
            }
        }

        return [
            'cleaned' => $cleaned,
            'errors' => $errors,
        ];
    }

    public function renewCertificate(SslCertificate $certificate): array
    {
        $mainLog = null;
        
        try {
            $mainLog = DeploymentLog::create([
                'type' => 'ssl_renewal',
                'action' => 'renew_certificate',
                'status' => 'running',
                'payload' => [
                    'certificate_id' => $certificate->id,
                    'domain_name' => $certificate->domain_name,
                    'current_expiry' => $certificate->expires_at,
                ],
                'started_at' => now(),
            ]);

            // Log das fases de renovação
            $this->logSslPhase($certificate, 'renewal_preparation', 'running', 'Preparando renovação do certificado...');
            $this->logSslPhase($certificate, 'renewal_preparation', 'success', 'Preparação concluída');

            $this->logSslPhase($certificate, 'renewal_execution', 'running', 'Executando renovação...');
            
            if (app()->environment('production')) {
                $result = $this->renewCertificateWithCertbot($certificate);
            } else {
                $result = $this->simulateCertificateRenewal($certificate);
            }
            
            $this->logSslPhase($certificate, 'renewal_execution', 'success', 'Renovação executada');

            $this->logSslPhase($certificate, 'renewal_verification', 'running', 'Verificando renovação...');
            
            $verificationResult = $this->verifyCertificateApplication($certificate);
            if (!$verificationResult['valid']) {
                throw new \Exception('Falha na verificação da renovação: ' . $verificationResult['error']);
            }
            
            $this->logSslPhase($certificate, 'renewal_verification', 'success', 'Renovação verificada');

            // Atualizar certificado
            $certificate->update([
                'status' => 'valid',
                'issued_at' => now(),
                'expires_at' => now()->addDays(90),
                'last_error' => null,
            ]);

            $mainLog->markAsSuccess("Certificado SSL renovado com sucesso para {$certificate->domain_name}");

            return [
                'success' => true,
                'message' => 'Certificate renewed successfully',
                'certificate' => $certificate,
                'verification' => $verificationResult,
            ];

        } catch (\Exception $e) {
            if ($mainLog) {
                $mainLog->markAsFailed($e->getMessage());
            }
            
            $certificate->update([
                'status' => 'failed',
                'last_error' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    private function renewCertificateWithCertbot(SslCertificate $certificate): array
    {
        $domainName = $certificate->domain_name;
        
        $command = sprintf(
            'certbot renew --cert-name %s --non-interactive',
            escapeshellarg($domainName)
        );

        $result = Process::run($command);
        
        if (!$result->successful()) {
            throw new \Exception('Certbot renewal failed: ' . $result->errorOutput());
        }

        return [
            'command' => $command,
            'stdout' => $result->output(),
            'stderr' => $result->errorOutput(),
        ];
    }

    public function revokeCertificate(SslCertificate $certificate): array
    {
        $mainLog = null;
        
        try {
            $mainLog = DeploymentLog::create([
                'type' => 'ssl_renewal',
                'action' => 'revoke_certificate',
                'status' => 'running',
                'payload' => [
                    'certificate_id' => $certificate->id,
                    'domain_name' => $certificate->domain_name,
                ],
                'started_at' => now(),
            ]);

            // Log das fases de revogação
            $this->logSslPhase($certificate, 'revocation_preparation', 'running', 'Preparando revogação do certificado...');
            $this->logSslPhase($certificate, 'revocation_preparation', 'success', 'Preparação concluída');

            $this->logSslPhase($certificate, 'revocation_execution', 'running', 'Executando revogação...');
            
            if (app()->environment('production')) {
                $this->revokeCertificateWithCertbot($certificate);
            } else {
                $this->simulateCertificateRevocation($certificate);
            }
            
            $this->logSslPhase($certificate, 'revocation_execution', 'success', 'Revogação executada');

            $this->logSslPhase($certificate, 'revocation_cleanup', 'running', 'Limpando arquivos e configurações...');
            
            $this->cleanupRevokedCertificate($certificate);
            
            $this->logSslPhase($certificate, 'revocation_cleanup', 'success', 'Limpeza concluída');

            $mainLog->markAsSuccess("Certificado SSL revogado com sucesso para {$certificate->domain_name}");

            return [
                'success' => true,
                'message' => 'Certificate revoked successfully',
            ];

        } catch (\Exception $e) {
            if ($mainLog) {
                $mainLog->markAsFailed($e->getMessage());
            }
            throw $e;
        }
    }

    private function revokeCertificateWithCertbot(SslCertificate $certificate): void
    {
        $domainName = $certificate->domain_name;
        
        $command = sprintf(
            'certbot revoke --cert-path %s --non-interactive',
            escapeshellarg($certificate->certificate_path)
        );

        $result = Process::run($command);
        
        if (!$result->successful()) {
            throw new \Exception('Certbot revocation failed: ' . $result->errorOutput());
        }
    }

    private function cleanupRevokedCertificate(SslCertificate $certificate): void
    {
        $this->removeMockCertificateFiles($certificate);
        
        if (app()->environment('production')) {
            $configPath = "/etc/nginx/sites-available/{$certificate->domain_name}";
            if (File::exists($configPath)) {
                File::delete($configPath);
                Process::run('systemctl reload nginx');
            }
        }
        
        $certificate->update([
            'status' => 'revoked',
            'revoked_at' => now(),
        ]);
    }
}
