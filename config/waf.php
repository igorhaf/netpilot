<?php

return [
    /*
    |--------------------------------------------------------------------------
    | WAF Configuration
    |--------------------------------------------------------------------------
    |
    | Settings for Web Application Firewall integration
    |
    */

    'enabled' => env('WAF_ENABLED', false),
    
    'provider' => env('WAF_PROVIDER', 'cloudflare'), // cloudflare, aws, modsecurity
    
    'cloudflare' => [
        'api_key' => env('CLOUDFLARE_API_KEY'),
        'zone_id' => env('CLOUDFLARE_ZONE_ID'),
    ],
    
    'aws' => [
        'key_id' => env('AWS_ACCESS_KEY_ID'),
        'secret_key' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
        'web_acl_id' => env('AWS_WAF_WEB_ACL_ID'),
    ],
    
    'modsecurity' => [
        'rules_path' => env('MODSECURITY_RULES_PATH', '/etc/modsecurity/rules'),
    ],
];
