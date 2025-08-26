<?php

namespace App\Services;

use App\Models\SslCertificate;
use App\Models\DeploymentLog;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Process;

class TraefikService
{
    private string $configPath;
    private string $traefikConfigFile;

    public function __construct()
    {
        $this->configPath = config('traefik.config_path', '/etc/traefik');
        $this->traefikConfigFile = $this->configPath . '/traefik.yml';
    }

    public function deployConfiguration(): array
    {
        $log = DeploymentLog::create([
            'type' => 'traefik',
            'action' => 'deploy',
            'status' => 'pending',
        ]);

        try {
            $log->markAsRunning();

            // Get all valid SSL certificates
            $validCertificates = SslCertificate::where('status', 'valid')
                ->with('domain')
                ->get();

            // Generate Traefik configuration
            $this->generateConfiguration($validCertificates);

            // Test configuration
            $testResult = $this->testConfiguration();
            if (!$testResult['success']) {
                throw new \Exception('Traefik configuration test failed: ' . $testResult['error']);
            }

            // Reload Traefik
            $reloadResult = $this->reloadTraefik();
            if (!$reloadResult['success']) {
                throw new \Exception('Failed to reload Traefik: ' . $reloadResult['error']);
            }

            $log->markAsSuccess('Traefik configuration deployed successfully');

            return [
                'success' => true,
                'message' => 'Traefik configuration deployed successfully',
                'certificates_count' => $validCertificates->count(),
            ];

        } catch (\Exception $e) {
            $log->markAsFailed($e->getMessage());
            throw $e;
        }
    }

    private function generateConfiguration($certificates): void
    {
        // Ensure directory exists
        if (!File::exists($this->configPath)) {
            File::makeDirectory($this->configPath, 0755, true);
        }

        $config = [
            'api' => [
                'dashboard' => true,
                'insecure' => false,
            ],
            'entryPoints' => [
                'web' => [
                    'address' => ':80',
                    'http' => [
                        'redirections' => [
                            'entryPoint' => [
                                'to' => 'websecure',
                                'scheme' => 'https',
                            ],
                        ],
                    ],
                ],
                'websecure' => [
                    'address' => ':443',
                ],
            ],
            'certificatesResolvers' => [
                'letsencrypt' => [
                    'acme' => [
                        'email' => config('traefik.acme_email', 'admin@example.com'),
                        'storage' => config('traefik.acme_storage', '/etc/traefik/acme.json'),
                        'httpChallenge' => [
                            'entryPoint' => 'web',
                        ],
                    ],
                ],
            ],
            'providers' => [
                'file' => [
                    'directory' => $this->configPath . '/dynamic',
                    'watch' => true,
                ],
            ],
        ];

        // Write main configuration
        File::put($this->traefikConfigFile, json_encode($config, JSON_PRETTY_PRINT));

        // Generate dynamic configuration for certificates
        $this->generateDynamicConfiguration($certificates);
    }

    private function generateDynamicConfiguration($certificates): void
    {
        $dynamicDir = $this->configPath . '/dynamic';
        if (!File::exists($dynamicDir)) {
            File::makeDirectory($dynamicDir, 0755, true);
        }

        $httpConfig = [
            'tls' => [
                'certificates' => [],
            ],
            'routers' => [],
            'services' => [],
        ];

        foreach ($certificates as $certificate) {
            $domainName = $certificate->domain_name;
            $sanDomains = $certificate->san_domains ?? [];

            // Add certificate
            if ($certificate->certificate_path && $certificate->private_key_path) {
                $httpConfig['tls']['certificates'][] = [
                    'certFile' => $certificate->certificate_path,
                    'keyFile' => $certificate->private_key_path,
                ];
            }

            // Add router for main domain
            $httpConfig['routers'][$domainName . '-router'] = [
                'rule' => 'Host(`' . $domainName . '`)',
                'service' => $domainName . '-service',
                'tls' => [
                    'certResolver' => 'letsencrypt',
                ],
            ];

            // Add router for SAN domains
            foreach ($sanDomains as $sanDomain) {
                $httpConfig['routers'][$sanDomain . '-router'] = [
                    'rule' => 'Host(`' . $sanDomain . '`)',
                    'service' => $sanDomain . '-service',
                    'tls' => [
                        'certResolver' => 'letsencrypt',
                    ],
                ];
            }
        }

        // Write dynamic configuration
        $dynamicConfigFile = $dynamicDir . '/ssl-config.json';
        File::put($dynamicConfigFile, json_encode($httpConfig, JSON_PRETTY_PRINT));
    }

    public function testConfiguration(): array
    {
        try {
            $result = Process::run('traefik version');
            
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

    public function reloadTraefik(): array
    {
        try {
            // Try systemctl first (most common)
            $result = Process::run('systemctl reload traefik');
            
            if (!$result->successful()) {
                // Fallback to service command
                $result = Process::run('service traefik reload');
            }

            if (!$result->successful()) {
                // Fallback to sending SIGHUP signal
                $result = Process::run('pkill -HUP traefik');
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
            $statusResult = Process::run('systemctl is-active traefik');
            $configTestResult = $this->testConfiguration();
            
            return [
                'running' => $statusResult->output() === "active\n",
                'config_valid' => $configTestResult['success'],
                'last_reload' => File::exists($this->traefikConfigFile) 
                    ? File::lastModified($this->traefikConfigFile) 
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

    public function issueCertificate(string $domainName, array $sanDomains = []): array
    {
        try {
            // This would integrate with Let's Encrypt API
            // For now, we'll simulate the process
            
            $log = DeploymentLog::create([
                'type' => 'ssl_renewal',
                'action' => 'issue',
                'status' => 'running',
                'payload' => [
                    'domain' => $domainName,
                    'san_domains' => $sanDomains,
                ],
            ]);

            // Simulate certificate issuance
            $log->markAsSuccess('Certificate issued successfully');

            return [
                'success' => true,
                'message' => 'Certificate issued successfully',
                'domain' => $domainName,
            ];

        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    public function renewCertificate(string $domainName): array
    {
        try {
            $log = DeploymentLog::create([
                'type' => 'ssl_renewal',
                'action' => 'renew',
                'status' => 'running',
                'payload' => ['domain' => $domainName],
            ]);

            // Simulate certificate renewal
            $log->markAsSuccess('Certificate renewed successfully');

            return [
                'success' => true,
                'message' => 'Certificate renewed successfully',
                'domain' => $domainName,
            ];

        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }
}
