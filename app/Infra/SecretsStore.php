<?php

namespace App\Infra;

use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Cache;

class SecretsStore
{
    private const CACHE_PREFIX = 'secrets:';
    private const DEFAULT_TTL = 3600; // 1 hour

    public function store(string $key, string $value, ?int $ttl = null): void
    {
        $encrypted = Crypt::encryptString($value);
        Cache::put(
            self::CACHE_PREFIX . $key,
            $encrypted,
            $ttl ?? self::DEFAULT_TTL
        );
    }

    public function retrieve(string $key): ?string
    {
        $encrypted = Cache::get(self::CACHE_PREFIX . $key);
        
        if (!$encrypted) {
            return null;
        }

        try {
            return Crypt::decryptString($encrypted);
        } catch (\Exception $e) {
            // If decryption fails, remove the corrupted entry
            $this->forget($key);
            return null;
        }
    }

    public function forget(string $key): void
    {
        Cache::forget(self::CACHE_PREFIX . $key);
    }

    public function exists(string $key): bool
    {
        return Cache::has(self::CACHE_PREFIX . $key);
    }

    public function storeDnsToken(string $provider, string $token): void
    {
        $this->store("dns_token:{$provider}", $token, 86400); // 24 hours
    }

    public function getDnsToken(string $provider): ?string
    {
        return $this->retrieve("dns_token:{$provider}");
    }

    public function storeApiKey(string $service, string $key): void
    {
        $this->store("api_key:{$service}", $key, 86400); // 24 hours
    }

    public function getApiKey(string $service): ?string
    {
        return $this->retrieve("api_key:{$service}");
    }

    public function storeCertificate(string $domain, array $certData): void
    {
        $this->store("cert:{$domain}", json_encode($certData), 2592000); // 30 days
    }

    public function getCertificate(string $domain): ?array
    {
        $data = $this->retrieve("cert:{$domain}");
        return $data ? json_decode($data, true) : null;
    }

    public function clearAll(): void
    {
        // Get all keys with our prefix
        $keys = Cache::getRedis()->keys(self::CACHE_PREFIX . '*');
        
        if (!empty($keys)) {
            foreach ($keys as $key) {
                // Remove the Redis key prefix if present
                $cleanKey = str_replace(config('cache.prefix') . ':', '', $key);
                Cache::forget($cleanKey);
            }
        }
    }

    public function listKeys(): array
    {
        $keys = Cache::getRedis()->keys(self::CACHE_PREFIX . '*');
        
        return array_map(function ($key) {
            // Remove cache prefix and our prefix
            $cleanKey = str_replace(config('cache.prefix') . ':', '', $key);
            return str_replace(self::CACHE_PREFIX, '', $cleanKey);
        }, $keys);
    }
}
