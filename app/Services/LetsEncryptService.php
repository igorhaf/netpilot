<?php

namespace App\Services;

use App\Models\SslCertificate;
use App\Models\DeploymentLog;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Process;

class LetsEncryptService
{
    private string $acmePath;
    private string $certificatesPath;

    public function __construct()
    {
        $this->acmePath = config('letsencrypt.acme_path', '/etc/letsencrypt');
        $this->certificatesPath = config('letsencrypt.certificates_path', '/etc/letsencrypt/live');
    }

    public function issueCertificate(SslCertificate $certificate): array
    {
        try {
            $log = DeploymentLog::create([
                'type' => 'ssl_renewal',
                'action' => 'issue',
                'status' => 'running',
                'payload' => [
                    'certificate_id' => $certificate->id,
                    'domain_name' => $certificate->domain_name,
                    'san_domains' => $certificate->san_domains,
                ],
            ]);

            // Simulate certificate issuance process
            $this->simulateCertificateIssuance($certificate);

            // Update certificate status
            $certificate->update([
                'status' => 'valid',
                'issued_at' => now(),
                'expires_at' => now()->addDays(90), // Let's Encrypt certificates are valid for 90 days
            ]);

            $log->markAsSuccess('Certificate issued successfully');

            return [
                'success' => true,
                'message' => 'Certificate issued successfully',
                'certificate' => $certificate,
            ];

        } catch (\Exception $e) {
            if (isset($log)) {
                $log->markAsFailed($e->getMessage());
            }
            
            $certificate->update([
                'status' => 'failed',
                'last_error' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    public function renewCertificate(SslCertificate $certificate): array
    {
        try {
            $log = DeploymentLog::create([
                'type' => 'ssl_renewal',
                'action' => 'renew',
                'status' => 'running',
                'payload' => [
                    'certificate_id' => $certificate->id,
                    'domain_name' => $certificate->domain_name,
                ],
            ]);

            // Simulate certificate renewal process
            $this->simulateCertificateRenewal($certificate);

            // Update certificate
            $certificate->update([
                'status' => 'valid',
                'issued_at' => now(),
                'expires_at' => now()->addDays(90),
                'last_error' => null,
            ]);

            $log->markAsSuccess('Certificate renewed successfully');

            return [
                'success' => true,
                'message' => 'Certificate renewed successfully',
                'certificate' => $certificate,
            ];

        } catch (\Exception $e) {
            if (isset($log)) {
                $log->markAsFailed($e->getMessage());
            }
            
            $certificate->update([
                'status' => 'failed',
                'last_error' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    public function revokeCertificate(SslCertificate $certificate): array
    {
        try {
            $log = DeploymentLog::create([
                'type' => 'ssl_renewal',
                'action' => 'revoke',
                'status' => 'running',
                'payload' => [
                    'certificate_id' => $certificate->id,
                    'domain_name' => $certificate->domain_name,
                ],
            ]);

            // Simulate certificate revocation
            $this->simulateCertificateRevocation($certificate);

            $log->markAsSuccess('Certificate revoked successfully');

            return [
                'success' => true,
                'message' => 'Certificate revoked successfully',
            ];

        } catch (\Exception $e) {
            if (isset($log)) {
                $log->markAsFailed($e->getMessage());
            }
            throw $e;
        }
    }

    private function simulateCertificateIssuance(SslCertificate $certificate): void
    {
        // Simulate the time it takes to issue a certificate
        sleep(2);

        // Generate mock certificate files
        $this->generateMockCertificateFiles($certificate);
    }

    private function simulateCertificateRenewal(SslCertificate $certificate): void
    {
        // Simulate the time it takes to renew a certificate
        sleep(1);

        // Update mock certificate files
        $this->generateMockCertificateFiles($certificate);
    }

    private function simulateCertificateRevocation(SslCertificate $certificate): void
    {
        // Simulate the time it takes to revoke a certificate
        sleep(1);

        // Remove mock certificate files
        $this->removeMockCertificateFiles($certificate);
    }

    private function generateMockCertificateFiles(SslCertificate $certificate): void
    {
        $domainPath = $this->certificatesPath . '/' . $certificate->domain_name;
        
        if (!File::exists($domainPath)) {
            File::makeDirectory($domainPath, 0755, true);
        }

        // Generate mock certificate content
        $certContent = $this->generateMockCertificateContent($certificate);
        $keyContent = $this->generateMockPrivateKeyContent();
        $chainContent = $this->generateMockChainContent();

        // Write mock files
        File::put($domainPath . '/cert.pem', $certContent);
        File::put($domainPath . '/privkey.pem', $keyContent);
        File::put($domainPath . '/chain.pem', $chainContent);

        // Update certificate paths in database
        $certificate->update([
            'certificate_path' => $domainPath . '/cert.pem',
            'private_key_path' => $domainPath . '/privkey.pem',
            'chain_path' => $domainPath . '/chain.pem',
        ]);
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

        // Clear paths in database
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

            // Simulate certificate validation
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
}
