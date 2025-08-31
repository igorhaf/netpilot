<?php

namespace App\Console\Commands;

use App\Services\ReconcilerService;
use Illuminate\Console\Command;

class ProxyReconcile extends Command
{
    protected $signature = 'proxy:reconcile 
                            {--component= : Specific component to reconcile (domains|upstreams|routes|redirects|certificates|traefik)}
                            {--verify : Only verify configurations without making changes}
                            {--status : Show reconciliation status}';
    
    protected $description = 'Reconcile proxy configurations with current state';

    private ReconcilerService $reconciler;

    public function __construct(ReconcilerService $reconciler)
    {
        parent::__construct();
        $this->reconciler = $reconciler;
    }

    public function handle(): int
    {
        if ($this->option('status')) {
            return $this->showStatus();
        }

        if ($this->option('verify')) {
            return $this->verifyConfigurations();
        }

        $component = $this->option('component');
        
        if ($component) {
            return $this->reconcileComponent($component);
        }

        // Full reconciliation
        $this->info('🔄 Starting full reconciliation...');
        
        $result = $this->reconciler->reconcileAll();
        
        if ($result['success']) {
            $this->info('✅ Reconciliation completed successfully');
            $this->displayResults($result['results']);
            return self::SUCCESS;
        } else {
            $this->error('❌ Reconciliation failed');
            if (isset($result['error'])) {
                $this->error('Error: ' . $result['error']);
            }
            if (isset($result['results'])) {
                $this->displayResults($result['results']);
            }
            return self::FAILURE;
        }
    }

    private function reconcileComponent(string $component): int
    {
        $this->info("🔄 Reconciling {$component}...");
        
        $method = 'reconcile' . ucfirst($component);
        
        if (!method_exists($this->reconciler, $method)) {
            $this->error("Invalid component: {$component}");
            $this->line('Valid components: domains, upstreams, routes, redirects, certificates, traefik');
            return self::FAILURE;
        }
        
        try {
            $result = $this->reconciler->$method();
            
            if ($result['success'] ?? false) {
                $this->info("✅ {$component} reconciled successfully");
            } else {
                $this->error("❌ Failed to reconcile {$component}");
            }
            
            $this->displayComponentResult($component, $result);
            
            return ($result['success'] ?? false) ? self::SUCCESS : self::FAILURE;
            
        } catch (\Exception $e) {
            $this->error("Fatal error: " . $e->getMessage());
            return self::FAILURE;
        }
    }

    private function verifyConfigurations(): int
    {
        $this->info('🔍 Verifying configurations...');
        
        $verification = $this->reconciler->verifyConfigurations();
        
        if ($verification['success']) {
            $this->info('✅ All configurations are valid');
            $this->line("Valid configs: {$verification['valid_configs']}");
            $this->line("Total files: {$verification['total_files']}");
        } else {
            $this->error('❌ Configuration verification failed');
            if (isset($verification['error'])) {
                $this->error('Error: ' . $verification['error']);
            }
            if (!empty($verification['invalid_configs'])) {
                $this->error('Invalid configs:');
                foreach ($verification['invalid_configs'] as $config) {
                    $this->error("  - {$config}");
                }
            }
        }
        
        return $verification['success'] ? self::SUCCESS : self::FAILURE;
    }

    private function showStatus(): int
    {
        $status = $this->reconciler->getStatus();
        
        $this->info('=== Reconciliation Status ===');
        $this->line('Enabled: ' . ($status['enabled'] ? 'Yes' : 'No'));
        $this->line('Interval: ' . $status['interval'] . ' seconds');
        
        if ($status['last_run']) {
            $this->line('Last run: ' . $status['last_run']->diffForHumans());
            $this->line('Last status: ' . $this->formatStatus($status['last_status']));
            $this->line('Next run: ' . $status['next_run']->diffForHumans());
        } else {
            $this->line('No previous reconciliation runs');
        }
        
        return self::SUCCESS;
    }

    private function displayResults(array $results): void
    {
        $this->newLine();
        $this->info('=== Reconciliation Results ===');
        
        foreach ($results as $component => $result) {
            $status = ($result['success'] ?? false) ? '✅' : '❌';
            $this->line("{$status} {$component}");
            
            if (isset($result['reconciled']) && isset($result['total'])) {
                $this->line("   Reconciled: {$result['reconciled']}/{$result['total']}");
            }
            
            if (!empty($result['errors'])) {
                foreach ($result['errors'] as $error) {
                    $this->error("   - {$error}");
                }
            }
            
            if (!empty($result['expiring_soon'])) {
                $this->warn("   Expiring soon:");
                foreach ($result['expiring_soon'] as $cert) {
                    $autoRenew = $cert['auto_renew'] ? 'auto-renew enabled' : 'auto-renew disabled';
                    $this->warn("   - {$cert['domain']} ({$cert['days']} days, {$autoRenew})");
                }
            }
            
            if (!empty($result['unhealthy'])) {
                $this->warn("   Unhealthy upstreams:");
                foreach ($result['unhealthy'] as $upstream) {
                    $this->warn("   - {$upstream}");
                }
            }
        }
    }

    private function displayComponentResult(string $component, array $result): void
    {
        $this->newLine();
        
        foreach ($result as $key => $value) {
            if ($key === 'success') continue;
            
            if (is_array($value)) {
                if (!empty($value)) {
                    $this->line("{$key}:");
                    foreach ($value as $item) {
                        $this->line("  - {$item}");
                    }
                }
            } else {
                $this->line("{$key}: {$value}");
            }
        }
    }

    private function formatStatus(?string $status): string
    {
        return match ($status) {
            'success' => '✅ Success',
            'failed' => '❌ Failed',
            'warning' => '⚠️ Warning',
            'running' => '🔄 Running',
            default => $status ?? 'Unknown'
        };
    }
}
