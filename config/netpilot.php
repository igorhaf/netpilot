<?php

return [
    'edge' => env('EDGE_PROVIDER', 'traefik'),
    'traefik' => [
        'dynamic_dir' => env('TRAEFIK_DYNAMIC_DIR', base_path('traefik/dynamic')),
        'config_dir' => storage_path('app/traefik'),
        'config_file' => 'netpilot-proxy.yml',
        'auto_reload' => env('TRAEFIK_AUTO_RELOAD', true),
    ],
];
