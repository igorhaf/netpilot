<?php

namespace App\Console\Commands;

use App\Models\SslCertificate;
use App\Models\CertificateEvent;
use App\Models\DeploymentLog;
use App\Services\LetsEncryptService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ProxyRenew extends Command
{
    protected $signature = 'proxy:renew 
                            {--domain= : Renew certificate for specific domain}
                            {--force : Force renewal even if not expiring soon}
                            {--dry-run : Check what would be renewed without actually renewing}';
    
    protected $description = 'Renew SSL certificates that are expiring soon';

    private LetsEncryptService $letsEncryptService;
    private int $renewalThresholdDays = 30; // Renew if expiring in 30 days or less

    public function __construct(LetsEncryptService $letsEncryptService)
    {
        parent::__construct();
        $this->letsEncryptService = $letsEncryptService;
    }

    public function handle(): int
    {
        $domain = $this->option('domain');
        $force = $this->option('force');
        $dryRun = $this->option('dry-run');

        $this->info('🔐 Starting SSL certificate renewal process...');
        
        // Create main deployment log
        $mainLog = null;
        if (!$dryRun) {
            $mainLog = DeploymentLog::create([
                'type' => 'ssl_renewal',
                'action' => 'bulk_renewal',
                'status' => 'running',
                'payload' => [
                    'domain' => $domain,
                    'force' => $force,
                    'threshold_days' => $this->renewalThresholdDays,
                ],
                'started_at' => now(),
            ]);
        }

        try {
            // Get certificates to renew
            $query = SslCertificate::with('domain')
                ->where('status', 'valid')
                ->where('auto_renew', true);

            if ($domain) {
                $query->where('domain_name', $domain);
            }

            if (!$force) {
                // Only renew certificates expiring within threshold
                $query->where('expires_at', '<=', now()->addDays($this->renewalThresholdDays));
            }

            $certificates = $query->get();

            if ($certificates->isEmpty()) {
                $this->info('✅ No certificates need renewal at this time.');
                if ($mainLog) {
                    $mainLog->markAsSuccess('No certificates needed renewal');
                }
                return self::SUCCESS;
            }

            $this->info(sprintf('Found %d certificate(s) to renew', $certificates->count()));
            $this->newLine();

            $renewed = 0;
            $failed = 0;
            $errors = [];

            foreach ($certificates as $certificate) {
                $this->info(sprintf('Processing: %s', $certificate->domain_name));
                
                // Calculate days until expiry
                $daysUntilExpiry = now()->diffInDays($certificate->expires_at, false);
                $this->line(sprintf('  Current expiry: %s (%d days)', 
                    $certificate->expires_at->format('Y-m-d H:i:s'),
                    $daysUntilExpiry
                ));

                if ($dryRun) {
                    $this->line('  [DRY RUN] Would renew this certificate');
                    continue;
                }

                try {
                    // Create certificate event
                    $event = CertificateEvent::create([
                        'certificate_id' => $certificate->id,
                        'event_type' => 'renewal_started',
                        'description' => sprintf('Automatic renewal started (expires in %d days)', $daysUntilExpiry),
                        'metadata' => [
                            'forced' => $force,
                            'days_until_expiry' => $daysUntilExpiry,
                            'initiated_by' => 'console_command',
                        ],
                    ]);

                    // Perform renewal
                    $result = $this->letsEncryptService->renewCertificate($certificate);
                    
                    // Log success event
                    CertificateEvent::create([
                        'certificate_id' => $certificate->id,
                        'event_type' => 'renewal_completed',
                        'description' => 'Certificate renewed successfully',
                        'metadata' => [
                            'new_expiry' => $certificate->fresh()->expires_at,
                            'verification' => $result['verification'] ?? null,
                        ],
                    ]);

                    $this->info(sprintf('  ✅ Renewed successfully (new expiry: %s)', 
                        $certificate->fresh()->expires_at->format('Y-m-d')
                    ));
                    $renewed++;

                } catch (\Exception $e) {
                    $failed++;
                    $errorMsg = $e->getMessage();
                    $errors[] = sprintf('%s: %s', $certificate->domain_name, $errorMsg);
                    
                    // Log failure event
                    CertificateEvent::create([
                        'certificate_id' => $certificate->id,
                        'event_type' => 'renewal_failed',
                        'description' => 'Certificate renewal failed',
                        'metadata' => [
                            'error' => $errorMsg,
                            'trace' => $e->getTraceAsString(),
                        ],
                    ]);

                    $this->error(sprintf('  ❌ Failed: %s', $errorMsg));
                    Log::error('Certificate renewal failed', [
                        'certificate_id' => $certificate->id,
                        'domain' => $certificate->domain_name,
                        'error' => $errorMsg,
                    ]);
                }

                $this->newLine();
            }

            // Summary
            $this->newLine();
            $this->info('=== Renewal Summary ===');
            $this->info(sprintf('✅ Renewed: %d', $renewed));
            if ($failed > 0) {
                $this->error(sprintf('❌ Failed: %d', $failed));
                foreach ($errors as $error) {
                    $this->error('  - ' . $error);
                }
            }

            if ($mainLog) {
                if ($failed > 0) {
                    $mainLog->markAsFailed(sprintf(
                        'Renewal completed with errors. Renewed: %d, Failed: %d', 
                        $renewed, 
                        $failed
                    ));
                } else {
                    $mainLog->markAsSuccess(sprintf(
                        'All certificates renewed successfully. Total: %d', 
                        $renewed
                    ));
                }
            }

            // Check for certificates expiring soon but not auto-renew enabled
            $this->checkUpcomingExpirations();

            return $failed > 0 ? self::FAILURE : self::SUCCESS;

        } catch (\Exception $e) {
            $this->error('Fatal error during renewal process: ' . $e->getMessage());
            Log::error('Fatal error in proxy:renew command', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            
            if ($mainLog) {
                $mainLog->markAsFailed('Fatal error: ' . $e->getMessage());
            }
            
            return self::FAILURE;
        }
    }

    private function checkUpcomingExpirations(): void
    {
        $upcomingExpiry = SslCertificate::where('status', 'valid')
            ->where('auto_renew', false)
            ->where('expires_at', '<=', now()->addDays(7))
            ->get();

        if ($upcomingExpiry->isNotEmpty()) {
            $this->newLine();
            $this->warn('⚠️  WARNING: The following certificates are expiring soon but auto-renew is disabled:');
            foreach ($upcomingExpiry as $cert) {
                $daysUntilExpiry = now()->diffInDays($cert->expires_at, false);
                $this->warn(sprintf('  - %s (expires in %d days)', 
                    $cert->domain_name, 
                    $daysUntilExpiry
                ));
            }
            $this->warn('Enable auto-renew or renew manually to avoid service disruption.');
        }
    }
}
