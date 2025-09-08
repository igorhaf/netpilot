<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Upstream;
use Illuminate\Support\Facades\Http;
use App\Services\MetricsService;
use App\Services\CircuitBreaker;

class UpstreamHealth extends Command
{
    private MetricsService $metrics;
    private CircuitBreaker $circuitBreaker;

    public function __construct(MetricsService $metrics, CircuitBreaker $circuitBreaker)
    {
        $this->metrics = $metrics;
        $this->circuitBreaker = $circuitBreaker;
        parent::__construct();
    }

    protected $signature = 'upstream:health 
        {--id=* : Upstream IDs to check}
        {--all : Check all upstreams}
        {--fix : Attempt to fix inactive upstreams}
        {--retry=3 : Number of retry attempts}
    ';

    protected $description = 'Check upstream health (TCP + HTTP) and update status';

    public function handle(): int
    {
        $query = Upstream::query();

        if ($this->option('all')) {
            $this->info('Checking all upstreams...');
        } elseif ($ids = $this->option('id')) {
            $query->whereIn('id', $ids);
            $this->info('Checking specified upstreams: ' . implode(', ', $ids));
        } else {
            $this->error('Must specify --all or --id');
            return self::FAILURE;
        }

        $success = true;
        
        foreach ($query->get() as $upstream) {
            // Skip upstream if circuit is open
            if (!$this->circuitBreaker->isAvailable($upstream)) {
                $this->warn('⚠️ Circuit breaker open - skipping');
                continue;
            }
            
            $this->line("\nChecking upstream: {$upstream->name} ({$upstream->target_url})");
            
            // TCP check
            $tcpOk = $this->checkTcpConnection(
                $upstream->target_url,
                $upstream->timeout_ms ?? 1000
            );
            
            // HTTP check if path is defined
            $httpOk = false;
            if ($tcpOk && $upstream->health_check_path) {
                $httpOk = $this->checkHttpEndpoint(
                    $upstream->target_url,
                    $upstream->health_check_path,
                    $upstream->timeout_ms ?? 1000
                );
            }
            
            $status = $tcpOk && (!$upstream->health_check_path || $httpOk);
            
            // Update upstream status
            $upstream->update([
                'last_checked_at' => now(),
                'is_healthy' => $status
            ]);
            
            $this->metrics->setUpstreamStatus($upstream->id, $status);
            
            if ($status) {
                $this->circuitBreaker->recordSuccess($upstream);
                $this->info('✅ HEALTHY');
            } else {
                $this->circuitBreaker->recordFailure($upstream);
                $success = false;
                $this->error('❌ UNHEALTHY');
            }
        }
        
        return $success ? self::SUCCESS : self::FAILURE;
    }

    private function checkTcpConnection(string $url, int $timeoutMs): bool
    {
        $parsed = parse_url($url);
        $host = $parsed['host'] ?? '';
        $port = $parsed['port'] ?? ($parsed['scheme'] === 'https' ? 443 : 80);

        $this->line("Testing TCP connection to {$host}:{$port}...");
        
        $fp = @fsockopen($host, $port, $errno, $errstr, max(1, $timeoutMs/1000));
        
        if ($fp) {
            fclose($fp);
            $this->info("TCP OK: {$host}:{$port}");
            return true;
        }
        
        $this->error("TCP FAIL: {$host}:{$port} - {$errstr}");
        return false;
    }

    private function checkHttpEndpoint(string $baseUrl, string $path, int $timeoutMs): bool
    {
        $url = rtrim($baseUrl, '/') . '/' . ltrim($path, '/');
        $this->line("Testing HTTP endpoint: {$url}");

        try {
            $response = Http::timeout($timeoutMs/1000)
                ->get($url)
                ->throw();
                
            $this->info(sprintf(
                'HTTP OK: Status %d (%s)',
                $response->status(),
                $response->effectiveUri()
            ));
            
            return true;
        } catch (\Exception $e) {
            $this->error("HTTP FAIL: " . $e->getMessage());
            return false;
        }
    }
}
