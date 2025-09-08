<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Let's Encrypt Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration for Let's Encrypt SSL certificate generation
    |
    */

    'wildcard' => [
        'enabled' => env('LETSENCRYPT_WILDCARD', false),
        'dns_provider' => env('LETSENCRYPT_DNS_PROVIDER', 'cloudflare'),
        'ttl' => env('LETSENCRYPT_DNS_TTL', 300),
    ],
    
    'email' => env('LETSENCRYPT_EMAIL', 'admin@localhost'),
    
    'acme_path' => env('LETSENCRYPT_ACME_PATH', '/etc/letsencrypt'),
    
    'certificates_path' => env('LETSENCRYPT_CERTS_PATH', '/etc/letsencrypt/live'),
    
    'staging' => env('LETSENCRYPT_STAGING', false),
    
    'webroot_path' => env('LETSENCRYPT_WEBROOT', '/var/www/html/.well-known/acme-challenge'),
    
    'challenge_method' => env('LETSENCRYPT_CHALLENGE', 'standalone'), // standalone, webroot, dns
    
    'dns_provider' => env('LETSENCRYPT_DNS_PROVIDER', 'cloudflare'), // cloudflare, route53, digitalocean
    
    'dns_credentials' => [
        'cloudflare' => [
            'api_key' => env('CLOUDFLARE_API_KEY'),
            'email' => env('CLOUDFLARE_EMAIL'),
        ],
        'route53' => [
            'key_id' => env('AWS_ACCESS_KEY_ID'),
            'secret_key' => env('AWS_SECRET_ACCESS_KEY'),
            'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
        ],
        'digitalocean' => [
            'api_token' => env('DIGITALOCEAN_API_TOKEN'),
        ],
    ],
    
    'key_size' => env('LETSENCRYPT_KEY_SIZE', 2048),
    
    'renewal_days_before' => env('LETSENCRYPT_RENEWAL_DAYS', 30),
    
    'auto_renew' => env('LETSENCRYPT_AUTO_RENEW', true),
    
    'certbot_path' => env('CERTBOT_PATH', '/usr/bin/certbot'),
];
