<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;

class CacheService
{
    public function get(string $key, callable $callback, int $ttl = 3600)
    {
        return Cache::remember($key, $ttl, $callback);
    }

    public function forget(string $key): void
    {
        Cache::forget($key);
    }

    public function cacheProxyConfig(string $domain, array $config): void
    {
        $this->get("proxy_config:{$domain}", fn() => $config, 86400);
    }

    public function getProxyConfig(string $domain): ?array
    {
        return Cache::get("proxy_config:{$domain}");
    }

    public function cacheSslCertificate(string $domain, array $certData): void
    {
        $this->get("ssl_cert:{$domain}", fn() => $certData, 86400);
    }

    public function getSslCertificate(string $domain): ?array
    {
        return Cache::get("ssl_cert:{$domain}");
    }
}
