<?php

return [
    'enabled' => env('PROXY_ENABLED', false),
    'proxy_network' => env('PROXY_NETWORK', 'proxy'),
    'dynamic_dir' => env('PROXY_DYNAMIC_DIR', base_path('docker/traefik/dynamic')),
    'challenge' => env('TRAEFIK_CHALLENGE', 'HTTP01'),
    'dns_provider' => env('TRAEFIK_DNS_PROVIDER'),
    'acme_email' => env('TRAEFIK_ACME_EMAIL'),
    'acme_ca' => env('TRAEFIK_ACME_CA_SERVER', 'https://acme-v02.api.letsencrypt.org/directory'),
    'api_url' => env('TRAEFIK_API_URL'),
];
