<?php

namespace App\Services;

use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use App\Models\Domain;
use App\Models\Upstream;
use App\Models\RouteRule;
use App\Models\RedirectRule;
use App\Models\SslCertificate;
use App\Models\DeploymentLog;
use App\Events\SslCertificateExpiring;
use App\Infra\Traefik\TraefikProvider;
use Carbon\Carbon;
use Symfony\Component\Yaml\Yaml;
use Illuminate\Support\Facades\DB;

class ReconcilerService
{
    private TraefikProvider $traefikProvider;
    private TraefikService $traefikService;
    private NginxService $nginxService;
    private int $reconcileInterval;
    private bool $enabled;
    
    public function __construct(
        TraefikProvider $traefikProvider,
        TraefikService $traefikService,
        NginxService $nginxService
    ) {
        $this->traefikProvider = $traefikProvider;
        $this->traefikService = $traefikService;
        $this->nginxService = $nginxService;
        $this->reconcileInterval = config('netpilot.reconcile_interval', 60);
        $this->enabled = config('netpilot.reconcile_enabled', true);
    }

    /**
     * Reconcile all configurations
     */
    public function reconcileAll(): array
    {
        if (!$this->enabled) {
            return [
                'success' => false,
                'message' => 'Reconciliation is disabled',
            ];
        }

        $mainLog = DeploymentLog::create([
            'type' => 'reconciliation',
            'action' => 'full_reconcile',
            'status' => 'running',
            'payload' => [
                'started_at' => now(),
                'edge' => config('netpilot.edge', 'traefik'),
            ],
            'started_at' => now(),
        ]);

        try {
            $results = [
                'domains' => $this->reconcileDomains(),
                'upstreams' => $this->reconcileUpstreams(),
                'routes' => $this->reconcileRoutes(),
                'redirects' => $this->reconcileRedirects(),
                'certificates' => $this->reconcileCertificates(),
                'traefik_sync' => $this->reconcileTraefik(),
                'verification' => $this->verifyConfigurations(),
            ];

            $allSuccess = collect($results)->every(fn($result) => $result['success'] ?? false);

            if ($allSuccess) {
                $mainLog->markAsSuccess('All configurations reconciled successfully');
            } else {
                $failedComponents = collect($results)
                    ->filter(fn($result) => !($result['success'] ?? false))
                    ->keys()
                    ->implode(', ');
                    
                $mainLog->markAsFailed("Reconciliation failed for: {$failedComponents}");
            }

            return [
                'success' => $allSuccess,
                'results' => $results,
                'timestamp' => now(),
            ];

        } catch (\Exception $e) {
            $mainLog->markAsFailed($e->getMessage());
            Log::error('Reconciliation failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
                'timestamp' => now(),
            ];
        }
    }

    /**
     * Reconcile domain configurations
     */
    public function reconcileDomains(): array
    {
        try {
            $domains = Domain::with(['proxyRules', 'sslCertificates'])->get();
            $reconciled = 0;
            $errors = [];

            foreach ($domains as $domain) {
                try {
                    // Ensure domain has proper proxy configuration
                    if ($domain->proxyRules->isEmpty() && $domain->sslCertificates->isEmpty()) {
                        Log::warning("Domain {$domain->name} has no proxy rules or SSL certificates");
                        continue;
                    }

                    // Apply domain configuration
                    $this->applyDomainConfiguration($domain);
                    $reconciled++;

                } catch (\Exception $e) {
                    $errors[] = "{$domain->name}: {$e->getMessage()}";
                    Log::error("Failed to reconcile domain {$domain->name}", [
                        'error' => $e->getMessage(),
                    ]);
                }
            }

            return [
                'success' => empty($errors),
                'reconciled' => $reconciled,
                'total' => $domains->count(),
                'errors' => $errors,
            ];

        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Reconcile upstream configurations
     */
    public function reconcileUpstreams(): array
    {
        try {
            $upstreams = Upstream::where('is_active', true)->get();
            $healthChecked = 0;
            $unhealthy = [];

            foreach ($upstreams as $upstream) {
                if ($upstream->health_check_path) {
                    $isHealthy = $this->checkUpstreamHealth($upstream);
                    
                    if (!$isHealthy) {
                        $unhealthy[] = $upstream->name;
                        $upstream->update(['last_health_check' => now()]);
                    } else {
                        $healthChecked++;
                    }
                }
            }

            return [
                'success' => true,
                'total' => $upstreams->count(),
                'health_checked' => $healthChecked,
                'unhealthy' => $unhealthy,
            ];

        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Reconcile route configurations
     */
    public function reconcileRoutes(): array
    {
        try {
            $routes = RouteRule::where('is_active', true)
                ->with(['domain', 'upstream'])
                ->get();

            $processed = 0;
            $errors = [];

            foreach ($routes as $route) {
                try {
                    // Validate route has required relationships
                    if (!$route->domain || !$route->upstream) {
                        throw new \Exception("Route {$route->id} missing domain or upstream");
                    }

                    // Ensure upstream is active
                    if (!$route->upstream->is_active) {
                        Log::warning("Route {$route->id} points to inactive upstream");
                        continue;
                    }

                    $processed++;

                } catch (\Exception $e) {
                    $errors[] = "Route {$route->id}: {$e->getMessage()}";
                }
            }

            return [
                'success' => empty($errors),
                'processed' => $processed,
                'total' => $routes->count(),
                'errors' => $errors,
            ];

        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Reconcile redirect configurations
     */
    public function reconcileRedirects(): array
    {
        try {
            $redirects = RedirectRule::where('is_active', true)->get();
            $validated = 0;
            $errors = [];

            foreach ($redirects as $redirect) {
                try {
                    // Validate redirect pattern
                    if (!$this->validateRedirectPattern($redirect)) {
                        throw new \Exception("Invalid pattern for redirect {$redirect->id}");
                    }

                    $validated++;

                } catch (\Exception $e) {
                    $errors[] = "Redirect {$redirect->id}: {$e->getMessage()}";
                }
            }

            return [
                'success' => empty($errors),
                'validated' => $validated,
                'total' => $redirects->count(),
                'errors' => $errors,
            ];

        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Reconcile SSL certificates
     */
    public function reconcileCertificates(): array
    {
        try {
            $certificates = SslCertificate::where('status', 'valid')->get();
            $expiringSoon = [];
            $expired = [];
            
            foreach ($certificates as $cert) {
                $daysUntilExpiry = now()->diffInDays($cert->expires_at, false);
                
                if ($daysUntilExpiry < 0) {
                    $expired[] = $cert->domain_name;
                    $cert->update(['status' => 'expired']);
                } elseif ($daysUntilExpiry <= 7) {
                    $expiringSoon[] = [
                        'domain' => $cert->domain_name,
                        'days' => $daysUntilExpiry,
                        'auto_renew' => $cert->auto_renew,
                    ];
                }
            }

            // Trigger alerts for expiring certificates
            if (!empty($expiringSoon)) {
                $this->triggerExpirationAlerts($expiringSoon);
            }

            return [
                'success' => empty($expired),
                'total' => $certificates->count(),
                'expiring_soon' => $expiringSoon,
                'expired' => $expired,
            ];

        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Sync Traefik configurations
     */
    public function reconcileTraefik(): array
    {
        try {
            // Use TraefikProvider to sync all configurations
            $this->traefikProvider->syncAll();

            // Generate configuration file first
            $generateResult = $this->traefikService->generateConfiguration();
            
            if (!$generateResult['success']) {
                return [
                    'success' => false,
                    'message' => 'Failed to generate Traefik configuration',
                    'error' => $generateResult['error'] ?? 'Unknown error',
                ];
            }

            // Apply Traefik configuration
            $reloadResult = $this->traefikService->applyConfiguration();

            return [
                'success' => $reloadResult['success'] ?? false,
                'message' => $reloadResult['success'] ? 'Traefik configurations synced' : 'Failed to reload Traefik',
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Verify configurations are properly applied
     */
    public function verifyConfigurations(): array
    {
        $dynamicDir = config('netpilot.dynamic_dir');
        
        if (!File::exists($dynamicDir)) {
            return [
                'success' => false,
                'error' => "Dynamic directory not found: {$dynamicDir}",
            ];
        }

        $configFiles = File::files($dynamicDir);
        $validConfigs = 0;
        $invalidConfigs = [];

        foreach ($configFiles as $file) {
            if ($file->getExtension() === 'yml' || $file->getExtension() === 'yaml') {
                try {
                    $content = Yaml::parseFile($file->getPathname());
                    if ($content !== null) {
                        $validConfigs++;
                    } else {
                        $invalidConfigs[] = $file->getFilename();
                    }
                } catch (\Exception $e) {
                    $invalidConfigs[] = $file->getFilename() . ' (' . $e->getMessage() . ')';
                }
            }
        }

        return [
            'success' => empty($invalidConfigs),
            'valid_configs' => $validConfigs,
            'invalid_configs' => $invalidConfigs,
            'total_files' => count($configFiles),
        ];
    }

    /**
     * Apply domain configuration
     */
    private function applyDomainConfiguration(Domain $domain): void
    {
        $edge = config('netpilot.edge', 'traefik');
        
        if ($edge === 'traefik') {
            $this->traefikService->applyDomain($domain);
        } else {
            $this->nginxService->applyDomain($domain);
        }
    }

    /**
     * Check upstream health
     */
    private function checkUpstreamHealth(Upstream $upstream): bool
    {
        try {
            $url = rtrim($upstream->target_url, '/') . '/' . ltrim($upstream->health_check_path, '/');
            
            $ch = curl_init($url);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_TIMEOUT, 5);
            curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            
            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);
            
            return $httpCode >= 200 && $httpCode < 400;
            
        } catch (\Exception $e) {
            Log::warning("Health check failed for upstream {$upstream->name}", [
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Validate redirect pattern
     */
    private function validateRedirectPattern(RedirectRule $redirect): bool
    {
        // Basic validation - ensure source and target are not empty
        if (empty($redirect->source_pattern) || empty($redirect->target_pattern)) {
            return false;
        }

        // Validate regex if it's a regex pattern
        if ($redirect->is_regex) {
            return @preg_match($redirect->source_pattern, '') !== false;
        }

        return true;
    }

    /**
     * Trigger expiration alerts
     */
    private function triggerExpirationAlerts(array $expiringSoon): void
    {
        foreach ($expiringSoon as $cert) {
            DeploymentLog::create([
                'type' => 'ssl_alert',
                'action' => 'expiration_warning',
                'status' => 'warning',
                'payload' => $cert,
                'output' => "Certificate for {$cert['domain']} expires in {$cert['days']} days",
                'started_at' => now(),
                'completed_at' => now(),
            ]);

            // Dispatch event for notification
            event(new \App\Events\SslCertificateExpiring($cert));
        }
    }

    /**
     * Get reconciliation status
     */
    public function getStatus(): array
    {
        $lastReconciliation = DeploymentLog::where('type', 'reconciliation')
            ->where('action', 'full_reconcile')
            ->latest()
            ->first();

        return [
            'enabled' => $this->enabled,
            'interval' => $this->reconcileInterval,
            'last_run' => $lastReconciliation?->started_at,
            'last_status' => $lastReconciliation?->status,
            'next_run' => $lastReconciliation 
                ? $lastReconciliation->started_at->addSeconds($this->reconcileInterval)
                : now(),
        ];
    }
}
