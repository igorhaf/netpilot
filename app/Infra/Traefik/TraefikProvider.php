<?php

namespace App\Infra\Traefik;

use App\Models\Domain;
use App\Models\RouteRule;
use App\Models\Upstream;
use App\Models\RedirectRule;

class TraefikProvider
{
    public function __construct(
        private readonly string $dynamicDir,
    ) {}

    public static function make(): self
    {
        $dir = config('netpilot.traefik.dynamic_dir', base_path('docker/traefik/dynamic'));
        return new self($dir);
    }

    public function syncAll(): array
    {
        $written = [];
        $domains = Domain::query()->where('is_active', true)->get();
        foreach ($domains as $domain) {
            $written[] = $this->writeDomain($domain);
        }
        $written[] = $this->writeRedirects();
        return $written;
    }

    public function writeDomain(Domain $domain): string
    {
        if (!is_dir($this->dynamicDir)) {
            @mkdir($this->dynamicDir, 0777, true);
        }

        $routers = [];
        $services = [];
        $middlewares = [];

        // Get routes for this domain
        $routes = RouteRule::query()
            ->where('domain_id', $domain->id)
            ->where('is_active', true)
            ->orderByDesc('priority')
            ->get();

        foreach ($routes as $route) {
            $hostRule = "Host(`{$domain->name}`)";
            $pathRule = $route->path_pattern ? "PathPrefix(`{$route->path_pattern}`)" : null;

            // Build the match rule
            $match = $pathRule ? $hostRule . ' && ' . $pathRule : $hostRule;

            // Add HTTP method filter if not *
            if ($route->http_method !== '*') {
                $match .= " && Method(`{$route->http_method}`)";
            }

            $serviceName = $this->serviceName($domain->name, $route->id);
            $routerName = $this->routerName($domain->name, $route->id);

            // Get the upstream for this route
            $upstream = Upstream::find($route->upstream_id);
            if (!$upstream || !$upstream->is_active) continue;

            $serverUrl = $this->upstreamUrl($upstream);

            // Create service
            $services[$serviceName] = [
                'loadBalancer' => [
                    'servers' => [['url' => $serverUrl]],
                    'healthCheck' => $upstream->health_check_path ? [
                        'path' => $upstream->health_check_path,
                        'interval' => $upstream->health_check_interval . 's'
                    ] : null
                ],
            ];

            // Remove null healthCheck if not set
            if (!$services[$serviceName]['loadBalancer']['healthCheck']) {
                unset($services[$serviceName]['loadBalancer']['healthCheck']);
            }

            $router = [
                'rule' => $match,
                'service' => $serviceName,
                'entryPoints' => ['web'],
                'priority' => (int)$route->priority,
            ];

            // Add middlewares
            $mwList = [];

            if ($route->strip_prefix && $route->path_pattern) {
                $mwName = $this->mwName($domain->name, $route->id, 'strip');
                $middlewares[$mwName] = [
                    'stripPrefix' => [
                        'prefixes' => [$route->path_pattern]
                    ]
                ];
                $mwList[] = $mwName;
            }

            // Force HTTPS redirect if enabled in domain settings
            if ($domain->force_https ?? true) {
                $mwName = $this->mwName($domain->name, $route->id, 'https');
                $middlewares[$mwName] = [
                    'redirectScheme' => [
                        'scheme' => 'https',
                        'permanent' => true
                    ]
                ];
                $mwList[] = $mwName;
            }

            // Add WWW redirect middleware if enabled
            if ($domain->www_redirect ?? false) {
                $mwName = $this->mwName($domain->name, $route->id, 'www');
                if ($domain->www_redirect_type === 'www_to_non_www') {
                    $middlewares[$mwName] = [
                        'redirectRegex' => [
                            'regex' => '^https?://www\\.(.*)',
                            'replacement' => 'https://${1}',
                            'permanent' => true
                        ]
                    ];
                } else {
                    $middlewares[$mwName] = [
                        'redirectRegex' => [
                            'regex' => '^https?://(?!www\\.)(.*)$',
                            'replacement' => 'https://www.${1}',
                            'permanent' => true
                        ]
                    ];
                }
                $mwList[] = $mwName;
            }

            // Add security headers if configured
            if (!empty($domain->security_headers)) {
                $mwName = $this->mwName($domain->name, $route->id, 'security');
                $middlewares[$mwName] = [
                    'headers' => [
                        'customRequestHeaders' => $domain->security_headers
                    ]
                ];
                $mwList[] = $mwName;
            }

            if ($mwList) {
                $router['middlewares'] = $mwList;
            }

            // Add TLS configuration if auto_tls is enabled
            if ($domain->auto_tls) {
                $router['entryPoints'] = ['websecure'];
                $router['tls'] = [
                    'certResolver' => 'letsencrypt',
                ];
            }

            // Create HTTP to HTTPS redirect router if force_https is enabled
            if ($domain->force_https ?? true) {
                $httpRouterName = $this->routerName($domain->name, $route->id) . '_http';
                $routers[$httpRouterName] = [
                    'rule' => $match,
                    'service' => 'api@internal', // Dummy service for redirect
                    'entryPoints' => ['web'],
                    'priority' => (int)$route->priority,
                    'middlewares' => [$this->mwName($domain->name, $route->id, 'https')]
                ];
            }

            $routers[$routerName] = $router;
        }

        $yaml = $this->toYaml([
            'http' => [
                'routers' => $routers,
                'services' => $services,
                'middlewares' => $middlewares,
            ]
        ]);

        $file = rtrim($this->dynamicDir, '/') . '/routes-' . str_replace(['*', '.'], ['wild', '_'], $domain->name) . '.yml';
        file_put_contents($file, $yaml);
        return $file;
    }

    public function writeRedirects(): string
    {
        if (!is_dir($this->dynamicDir)) {
            @mkdir($this->dynamicDir, 0777, true);
        }

        $routers = [];
        $middlewares = [];
        $services = ['noop' => ['loadBalancer' => ['servers' => [['url' => 'http://127.0.0.1:1']]]]];

        $redirects = RedirectRule::query()
            ->with('domain')
            ->where('is_active', true)
            ->orderByDesc('priority')
            ->get();

        foreach ($redirects as $redirect) {
            $domain = $redirect->domain;
            if (!$domain) continue;

            $hostRule = "Host(`{$domain->name}`)";
            $pathRule = $redirect->source_pattern ? "PathPrefix(`{$redirect->source_pattern}`)" : null;
            $match = $pathRule ? $hostRule . ' && ' . $pathRule : $hostRule;

            $mwName = 'redirect_' . md5($domain->name . '|' . ($redirect->source_pattern ?? '') . '|' . $redirect->target_url);

            $replacement = $redirect->target_url;
            if ($redirect->preserve_query) {
                $replacement .= '${query}';
            }

            $middlewares[$mwName] = [
                'redirectRegex' => [
                    'regex' => '.*',
                    'replacement' => $replacement,
                    'permanent' => $redirect->redirect_type == 301,
                ]
            ];

            $routers['redirect_' . $redirect->id] = [
                'rule' => $match,
                'service' => 'noop',
                'entryPoints' => ['web', 'websecure'],
                'priority' => $redirect->priority,
                'middlewares' => [$mwName],
            ];
        }

        $yaml = $this->toYaml([
            'http' => [
                'routers' => $routers,
                'services' => $services,
                'middlewares' => $middlewares,
            ]
        ]);

        $file = rtrim($this->dynamicDir, '/') . '/redirects.yml';
        
        // Ensure directory exists and is writable
        if (!is_dir($this->dynamicDir)) {
            @mkdir($this->dynamicDir, 0777, true);
        }
        
        // Use error suppression and check result
        $result = @file_put_contents($file, $yaml);
        if ($result === false) {
            throw new \Exception("Failed to write redirects file to: {$file}");
        }
        
        return $file;
    }

    private function upstreamUrl(Upstream $upstream): string
    {
        return $upstream->target_url;
    }

    private function routerName(string $host, int $ruleId): string
    {
        return 'r_' . preg_replace('/[^a-z0-9]+/i', '_', $host) . '_' . $ruleId;
    }

    private function serviceName(string $host, int $ruleId): string
    {
        return 's_' . preg_replace('/[^a-z0-9]+/i', '_', $host) . '_' . $ruleId;
    }

    private function mwName(string $host, int $ruleId, string $type): string
    {
        return 'm_' . $type . '_' . preg_replace('/[^a-z0-9]+/i', '_', $host) . '_' . $ruleId;
    }

    private function toYaml(array $data, int $indent = 0): string
    {
        // Minimal YAML renderer to avoid extra deps
        $out = '';
        foreach ($data as $key => $val) {
            $pad = str_repeat('  ', $indent);
            if (is_array($val)) {
                if ($this->isAssoc($val)) {
                    $out .= "$pad$key:\n" . $this->toYaml($val, $indent + 1);
                } else {
                    $out .= "$pad$key:\n";
                    foreach ($val as $v) {
                        if (is_array($v)) {
                            $out .= $pad . '  - ' . "\n" . $this->toYaml($v, $indent + 2);
                        } else {
                            $out .= $pad . '  - ' . $this->yamlScalar($v) . "\n";
                        }
                    }
                }
            } else {
                $out .= $pad . $key . ': ' . $this->yamlScalar($val) . "\n";
            }
        }
        return $out;
    }

    private function yamlScalar(mixed $v): string
    {
        if (is_bool($v)) return $v ? 'true' : 'false';
        if (is_numeric($v)) return (string)$v;
        if ($v === null) return '';
        $s = (string)$v;
        if (preg_match('/[:#{}\[\],&*?]|^\s|\s$/', $s)) {
            return '"' . str_replace('"', '\\"', $s) . '"';
        }
        return $s;
    }

    private function isAssoc(array $arr): bool
    {
        return array_keys($arr) !== range(0, count($arr) - 1);
    }
}
