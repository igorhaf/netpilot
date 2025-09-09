<?php

namespace App\Services;

use App\Exceptions\ProxyException;
use App\Models\Domain;
use App\Models\ProxyRule;
use Illuminate\Support\Facades\Storage;
use App\Services\MetricsService;
use App\Services\CacheService;
use App\Services\CircuitBreakerService;
use App\Services\SystemCommandService;

class TraefikService
{
    private string $configDir;
    private string $configFile;
    private string $traefikDynamicDir;

    public function __construct(
        private SystemCommandService $cmd,
        private MetricsService $metrics,
        private CacheService $cache,
        private CircuitBreakerService $circuitBreaker
    ) 
    {
        $this->configDir = config('netpilot.traefik.config_dir', storage_path('app/traefik'));
        $this->configFile = $this->configDir . '/' . config('netpilot.traefik.config_file', 'netpilot-proxy.yml');
        $this->traefikDynamicDir = config('netpilot.traefik.dynamic_dir', base_path('traefik/dynamic'));
        
        // Criar diretório se não existir
        if (!is_dir($this->configDir)) {
            mkdir($this->configDir, 0755, true);
        }
        
        // Criar diretório Traefik se não existir
        if (!is_dir($this->traefikDynamicDir)) {
            mkdir($this->traefikDynamicDir, 0755, true);
        }
    }

    public function applyDomain(Domain $domain, ?array $sslPaths = null): array
    {
        // Gerar configuração dinâmica para Traefik e salvar no diretório observado
        $dynamicDir = config('netpilot.traefik.dynamic_dir', base_path('docker/traefik/dynamic'));
        if (!is_dir($dynamicDir)) {
            mkdir($dynamicDir, 0755, true);
        }

        $configFile = rtrim($dynamicDir, '/')."/{$domain->name}.yml";

        // Usar entryPoints padronizados do Traefik: web e websecure
        // Forçar TLS com o resolver configurado no traefik.yml (le_http01)
        $yaml = sprintf(
            "http:\n  routers:\n    %s-http:\n      rule: Host(`%s`)\n      entryPoints: [web]\n      service: %s-svc\n    %s-https:\n      rule: Host(`%s`)\n      entryPoints: [websecure]\n      service: %s-svc\n      tls:\n        certResolver: letsencrypt\n  services:\n    %s-svc:\n      loadBalancer:\n        servers:\n          - url: 'http://laravel.test:80'\n",
            $domain->name,
            $domain->name,
            $domain->name,
            $domain->name,
            $domain->name,
            $domain->name,
            $domain->name
        );

        file_put_contents($configFile, $yaml);

        // Registrar operação (sem reload via systemctl; Traefik está com watch habilitado)
        $this->cmd->execute('traefik', 'config_written', 'echo "Traefik dynamic config written"', [
            'domain' => $domain->name,
            'file' => $configFile,
        ]);

        return [
            'success' => true,
            'file' => $configFile,
        ];
    }

    /**
     * Remove configuração dinâmica do domínio
     */
    public function removeDomain(\App\Models\Domain $domain): array
    {
        $configFile = $this->traefikDynamicDir . '/' . $domain->name . '.yml';
        
        \Log::info("🗑️ Removendo configuração Traefik para {$domain->name}", [
            'config_file' => $configFile,
        ]);

        if (file_exists($configFile)) {
            if (unlink($configFile)) {
                \Log::info("✅ Arquivo de configuração removido: {$configFile}");
            } else {
                \Log::error("❌ Falha ao remover arquivo: {$configFile}");
                throw new \Exception("Não foi possível remover a configuração do Traefik");
            }
        } else {
            \Log::info("ℹ️ Arquivo de configuração não existe: {$configFile}");
        }

        return [
            'success' => true,
            'removed_file' => $configFile,
        ];
    }

    /**
     * Gera arquivo de configuração do Traefik localmente (sem reload)
     */
    public function generateConfiguration(): array
    {
        try {
            \Log::info("🔧 TraefikService::generateConfiguration iniciado", [
                'config_dir' => $this->configDir,
                'config_file' => $this->configFile,
                'traefik_dynamic_dir' => $this->traefikDynamicDir
            ]);
            
            if ($cached = $this->cache->getProxyConfig()) {
                return $cached;
            }
            
            $yaml = $this->buildDynamicConfig();
            
            \Log::info("📝 YAML gerado", [
                'yaml_length' => strlen($yaml),
                'yaml_preview' => substr($yaml, 0, 100)
            ]);
            
            // Salvar arquivo localmente
            $saved = Storage::put('traefik/netpilot-proxy.yml', $yaml);
            
            \Log::info("💾 Tentativa de salvar arquivo", [
                'saved' => $saved,
                'storage_path' => Storage::path('traefik/netpilot-proxy.yml'),
                'file_exists' => Storage::exists('traefik/netpilot-proxy.yml')
            ]);
            
            if (!$saved) {
                throw ProxyException::fileSaveFailed();
            }

            // Verificar se realmente foi salvo
            $fileSize = Storage::size('traefik/netpilot-proxy.yml');
            $fileExists = Storage::exists('traefik/netpilot-proxy.yml');
            $storagePath = Storage::path('traefik/netpilot-proxy.yml');
            
            \Log::info("✅ Arquivo salvo", [
                'file_size' => $fileSize,
                'file_exists' => $fileExists,
                'storage_path' => $storagePath
            ]);

            $this->metrics->incrementRequestCount('traefik_generate_config');

            $this->cache->cacheProxyConfig($yaml);

            return [
                'success' => true,
                'message' => 'Configuração do Traefik gerada com sucesso!',
                'file_path' => $storagePath,
                'file_size' => $fileSize,
                'config_preview' => $this->getConfigPreview($yaml),
                'debug_info' => [
                    'storage_path' => $storagePath,
                    'file_exists' => $fileExists,
                    'config_dir' => $this->configDir,
                    'config_file' => $this->configFile,
                    'traefik_dynamic_dir' => $this->traefikDynamicDir
                ]
            ];

        } catch (\Exception $e) {
            $this->metrics->incrementRequestCount('traefik_generate_config_error');
            \Log::error("❌ Erro em generateConfiguration", [
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);
            
            return [
                'success' => false,
                'message' => 'Erro ao gerar configuração do Traefik: ' . $e->getMessage(),
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Deploy das configurações do Traefik (apenas gera arquivo local)
     */
    public function deployConfiguration(): array
    {
        try {
            // Apenas gerar o arquivo localmente
            $result = $this->generateConfiguration();
            
            if (!$result['success']) {
                throw new ProxyException($result['message']);
            }

            // Log da operação
            $this->cmd->execute('traefik', 'config_generated', 'echo "Configuração Traefik gerada localmente"', [
                'action' => 'generate_config',
                'description' => 'Arquivo de configuração do Traefik gerado em ' . $this->configFile
            ]);

            return [
                'success' => true,
                'message' => 'Configuração do Traefik gerada localmente com sucesso!',
                'file_path' => $this->configFile,
                'note' => 'Arquivo salvo localmente. Para aplicar, copie para /etc/traefik/dynamic/ e recarregue o Traefik manualmente.',
                'config_preview' => $result['config_preview']
            ];

        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Erro ao gerar configuração do Traefik: ' . $e->getMessage(),
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Aplica configuração usando Docker (dentro do ambiente Sail)
     */
    public function applyConfiguration(): array
    {
        try {
            \Log::info("🚀 TraefikService::applyConfiguration iniciado");
            
            // Verificar se arquivo existe
            if (!Storage::exists('traefik/netpilot-proxy.yml')) {
                throw ProxyException::fileNotFound();
            }

            // Ler conteúdo
            $yaml = Storage::get('traefik/netpilot-proxy.yml');
            $localPath = Storage::path('traefik/netpilot-proxy.yml');
            
            \Log::info("📖 Arquivo local lido", [
                'local_path' => $localPath,
                'file_size' => strlen($yaml),
                'content_preview' => substr($yaml, 0, 100)
            ]);
            
            // 1. Copiar arquivo para o diretório Traefik (volume compartilhado)
            $traefikConfigFile = $this->traefikDynamicDir . '/netpilot-proxy.yml';
            
            \Log::info("📝 Copiando arquivo para Traefik", [
                'source' => $localPath,
                'destination' => $traefikConfigFile
            ]);
            
            $copyResult = copy($localPath, $traefikConfigFile);
            
            if (!$copyResult) {
                throw ProxyException::fileCopyFailed();
            }
            
            \Log::info("✅ Arquivo copiado para Traefik", [
                'traefik_file' => $traefikConfigFile,
                'file_exists' => file_exists($traefikConfigFile)
            ]);
            
            // 2. Recarregar Traefik via API HTTP (em vez de systemctl)
            \Log::info("🔄 Tentando recarregar Traefik via API");
            
            $reloadResult = $this->reloadTraefikViaApi();
            
            if (!$reloadResult['success']) {
                return [
                    'success' => false,
                    'message' => 'Arquivo copiado para Traefik, mas falha ao recarregar. Verifique se o container Traefik está rodando.',
                    'local_file' => $localPath,
                    'traefik_file' => $traefikConfigFile,
                    'reload_error' => $reloadResult['error'] ?? 'Erro desconhecido',
                    'debug_info' => $reloadResult
                ];
            }

            \Log::info("✅ Configuração aplicada com sucesso!");

            return [
                'success' => true,
                'message' => 'Configuração do Traefik aplicada com sucesso!',
                'local_file' => $localPath,
                'traefik_file' => $traefikConfigFile,
                'reload_result' => $reloadResult,
                'note' => 'Configuração aplicada via volume compartilhado Docker. Traefik detectará automaticamente as mudanças.'
            ];

        } catch (\Exception $e) {
            \Log::error("❌ Erro em applyConfiguration", [
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);
            
            return [
                'success' => false,
                'message' => 'Erro ao aplicar configuração do Traefik: ' . $e->getMessage(),
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Recarrega Traefik via API HTTP (funciona dentro do Docker)
     */
    private function reloadTraefikViaApi(): array
    {
        return $this->circuitBreaker->execute('traefik', function() {
            try {
                // Since Traefik is configured with file watch, we just need to ensure the file is copied
                // The configuration will be automatically reloaded
                \Log::info("🌐 Traefik configured with file watch - configuration will auto-reload");
                
                // Verify that the dynamic config file exists
                $dynamicFile = $this->traefikDynamicDir . '/netpilot-proxy.yml';
                if (file_exists($dynamicFile)) {
                    return [
                        'success' => true,
                        'message' => 'Configuration file deployed - Traefik will auto-reload',
                        'file' => $dynamicFile,
                        'note' => 'Traefik is configured with --providers.file.watch=true'
                    ];
                }
                
                return [
                    'success' => false,
                    'error' => 'Configuration file not found at ' . $dynamicFile
                ];
                
            } catch (\Exception $e) {
                \Log::error("❌ Erro ao acessar API Traefik", [
                    'error' => $e->getMessage()
                ]);
                
                return [
                    'success' => false,
                    'error' => 'Erro ao acessar API Traefik: ' . $e->getMessage()
                ];
            }
        });
    }

    /**
     * Obtém preview da configuração (primeiras linhas)
     */
    private function getConfigPreview(string $yaml): string
    {
        $lines = explode("\n", $yaml);
        $preview = array_slice($lines, 0, 10);
        return implode("\n", $preview) . (count($lines) > 10 ? "\n..." : "");
    }

    private function buildDynamicConfig(): string
    {
        $rules = ProxyRule::where('is_active', true)->orderBy('priority', 'desc')->get();

        $routers = [];
        $services = [];

        foreach ($rules as $rule) {
            $routerName = sprintf('router-%d', $rule->id);
            $serviceName = sprintf('service-%d', $rule->id);

            // Determinar o entrypoint correto baseado no protocolo
            $entryPoint = strtolower($rule->protocol) === 'https' ? 'websecure' : 'web';

            $routers[] = sprintf("    %s:\n      rule: Host(`%s`)\n      entryPoints: [%s]\n      service: %s\n",
                $routerName,
                $rule->source_host,
                $entryPoint,
                $serviceName
            );

            // Para o serviço, usar o protocolo correto baseado na porta de destino
            $targetScheme = $this->resolveTargetScheme($rule->target_port);
            
            // Se o host de destino for localhost, usar o nome do serviço Docker
            $targetHost = $rule->target_host === 'localhost' ? 'laravel.test' : $rule->target_host;
            
            // Se a porta de destino for uma porta externa comum, usar a porta interna do container
            $targetPort = match($rule->target_port) {
                '8484' => 80,    // Porta externa Laravel -> porta interna 80
                '3000' => 80,    // Porta externa Node.js -> porta interna 80
                '8080' => 80,    // Porta externa comum -> porta interna 80
                default => (int)$rule->target_port
            };
            
            $services[] = sprintf("    %s:\n      loadBalancer:\n        servers:\n          - url: '%s://%s:%s'\n",
                $serviceName,
                $targetScheme,
                $targetHost,
                $targetPort
            );
        }

        $yaml = "http:\n  routers:\n" . implode('', $routers) . "  services:\n" . implode('', $services);
        return $yaml;
    }

    /**
     * Resolve o protocolo baseado na porta de destino
     */
    private function resolveTargetScheme(int $port): string
    {
        return match($port) {
            443, 8443 => 'https',
            default => 'http'
        };
    }
}
