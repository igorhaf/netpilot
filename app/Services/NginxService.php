<?php

namespace App\Services;

use App\Models\ProxyRule;
use App\Models\Domain;
use App\Models\DeploymentLog;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Process;

class NginxService
{
    private string $configPath;
    private string $sitesAvailablePath;
    private string $sitesEnabledPath;

    public function __construct()
    {
        $this->configPath = config('nginx.config_path', '/etc/nginx');
        $this->sitesAvailablePath = $this->configPath . '/sites-available';
        $this->sitesEnabledPath = $this->configPath . '/sites-enabled';
    }

    public function deployConfiguration(): array
    {
        $log = DeploymentLog::create([
            'type' => 'nginx',
            'action' => 'deploy',
            'status' => 'pending',
        ]);

        try {
            $log->markAsRunning();

            // Get all active proxy rules
            $activeRules = ProxyRule::where('is_active', true)
                ->with('domain')
                ->orderBy('priority')
                ->get();

            if ($activeRules->isEmpty()) {
                $log->markAsSuccess('Nenhuma regra ativa para configurar');
                return [
                    'success' => true,
                    'message' => 'Nenhuma regra ativa para configurar',
                    'rules_count' => 0,
                ];
            }

            // Generate Nginx configuration
            $this->generateMainConfiguration();
            $this->generateSiteConfigurations($activeRules);

            // Test configuration
            $testResult = $this->testConfiguration();
            if (!$testResult['success']) {
                throw new \Exception('Nginx configuration test failed: ' . $testResult['error']);
            }

            // Reload Nginx
            $reloadResult = $this->reloadNginx();
            if (!$reloadResult['success']) {
                throw new \Exception('Failed to reload Nginx: ' . $reloadResult['error']);
            }

            $log->markAsSuccess('Nginx configuration deployed successfully');

            return [
                'success' => true,
                'message' => 'Nginx configuration deployed successfully',
                'rules_count' => $activeRules->count(),
            ];

        } catch (\Exception $e) {
            $log->markAsFailed($e->getMessage());
            throw $e;
        }
    }

    private function generateMainConfiguration(): void
    {
        // Ensure directories exist
        if (!File::exists($this->sitesAvailablePath)) {
            File::makeDirectory($this->sitesAvailablePath, 0755, true);
        }
        if (!File::exists($this->sitesEnabledPath)) {
            File::makeDirectory($this->sitesEnabledPath, 0755, true);
        }

        // Generate main nginx.conf if it doesn't exist
        $mainConfigPath = $this->configPath . '/nginx.conf';
        if (!File::exists($mainConfigPath)) {
            $mainConfig = $this->getMainNginxConfig();
            File::put($mainConfigPath, $mainConfig);
        }
    }

    private function generateSiteConfigurations($proxyRules): void
    {
        // Group rules by domain
        $rulesByDomain = $proxyRules->groupBy('domain_id');

        foreach ($rulesByDomain as $domainId => $rules) {
            $domain = $rules->first()->domain;
            $siteConfig = $this->generateSiteConfig($domain, $rules);
            
            $siteConfigPath = $this->sitesAvailablePath . '/' . $domain->name;
            File::put($siteConfigPath, $siteConfig);

            // Enable site
            $enabledPath = $this->sitesEnabledPath . '/' . $domain->name;
            if (!File::exists($enabledPath)) {
                File::link($siteConfigPath, $enabledPath);
            }
        }
    }

    private function generateSiteConfig(Domain $domain, $rules): string
    {
        $config = "server {\n";
        $config .= "    listen 80;\n";
        $config .= "    server_name {$domain->name};\n\n";

        // Add custom headers if any
        if ($domain->dns_records && isset($domain->dns_records['headers'])) {
            foreach ($domain->dns_records['headers'] as $key => $value) {
                $config .= "    add_header {$key} {$value};\n";
            }
            $config .= "\n";
        }

        // Generate location blocks for each rule
        foreach ($rules as $rule) {
            $config .= $this->generateLocationBlock($rule);
        }

        // Add default location block
        $config .= "    location / {\n";
        $config .= "        return 404;\n";
        $config .= "    }\n";
        $config .= "}\n";

        return $config;
    }

    private function generateLocationBlock($rule): string
    {
        $config = "    location / {\n";
        
        // Add proxy settings
        $config .= "        proxy_pass {$rule->protocol}://{$rule->target_host}:{$rule->target_port};\n";
        $config .= "        proxy_set_header Host \$host;\n";
        $config .= "        proxy_set_header X-Real-IP \$remote_addr;\n";
        $config .= "        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;\n";
        $config .= "        proxy_set_header X-Forwarded-Proto \$scheme;\n";
        
        // Add custom headers if any
        if ($rule->headers) {
            foreach ($rule->headers as $key => $value) {
                $config .= "        proxy_set_header {$key} {$value};\n";
            }
        }
        
        $config .= "        proxy_connect_timeout 60s;\n";
        $config .= "        proxy_send_timeout 60s;\n";
        $config .= "        proxy_read_timeout 60s;\n";
        $config .= "    }\n\n";
        
        return $config;
    }

    private function getMainNginxConfig(): string
    {
        return <<<'EOT'
user www-data;
worker_processes auto;
pid /run/nginx.pid;
include /etc/nginx/modules-enabled/*.conf;

events {
    worker_connections 768;
}

http {
    sendfile on;
    tcp_nopush on;
    types_hash_max_size 2048;
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;

    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    include /etc/nginx/conf.d/*.conf;
    include /etc/nginx/sites-enabled/*;
}
EOT;
    }

    public function testConfiguration(): array
    {
        try {
            $result = Process::run('nginx -t');
            
            return [
                'success' => $result->successful(),
                'output' => $result->output(),
                'error' => $result->errorOutput(),
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    public function reloadNginx(): array
    {
        try {
            // Try systemctl first (most common)
            $result = Process::run('systemctl reload nginx');
            
            if (!$result->successful()) {
                // Fallback to service command
                $result = Process::run('service nginx reload');
            }

            if (!$result->successful()) {
                // Fallback to sending SIGHUP signal
                $result = Process::run('pkill -HUP nginx');
            }
            
            return [
                'success' => $result->successful(),
                'output' => $result->output(),
                'error' => $result->errorOutput(),
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    public function getStatus(): array
    {
        try {
            $statusResult = Process::run('systemctl is-active nginx');
            $configTestResult = $this->testConfiguration();
            
            return [
                'running' => $statusResult->output() === "active\n",
                'config_valid' => $configTestResult['success'],
                'last_reload' => File::exists($this->configPath . '/nginx.conf') 
                    ? File::lastModified($this->configPath . '/nginx.conf') 
                    : null,
            ];
        } catch (\Exception $e) {
            return [
                'running' => false,
                'config_valid' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    public function getActiveRules(): array
    {
        $rules = ProxyRule::where('is_active', true)
            ->with('domain')
            ->orderBy('priority')
            ->get();

        return $rules->map(function ($rule) {
            return [
                'id' => $rule->id,
                'domain' => $rule->domain->name,
                'source' => "{$rule->protocol}://{$rule->source_host}:{$rule->source_port}",
                'target' => "{$rule->protocol}://{$rule->target_host}:{$rule->target_port}",
                'priority' => $rule->priority,
                'status' => $rule->is_active ? 'active' : 'inactive',
            ];
        })->toArray();
    }

    public function validateRule($rule): array
    {
        $errors = [];

        if (empty($rule['source_host'])) {
            $errors[] = 'Host de origem é obrigatório';
        }

        if (empty($rule['target_host'])) {
            $errors[] = 'Host de destino é obrigatório';
        }

        if (!in_array($rule['source_port'], [80, 443, 8080, 3000, 9000])) {
            $errors[] = 'Porta de origem inválida';
        }

        if (!in_array($rule['protocol'], ['http', 'https'])) {
            $errors[] = 'Protocolo inválido';
        }

        return [
            'valid' => empty($errors),
            'errors' => $errors,
        ];
    }
}
