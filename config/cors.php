<?php

return [
    // Apply CORS to these paths
    'paths' => [
        'api/*',
        'proxy*',
        'sanctum/csrf-cookie',
        // enable globally if needed
        '*',
    ],

    // Methods allowed
    'allowed_methods' => ['*'],

    // Allowed origins (do NOT use * when credentials are enabled)
    // Configure via ENV for safety. Example:
    // CORS_ALLOWED_ORIGINS="http://meadadigital.com,https://meadadigital.com"
    'allowed_origins' => array_filter(
        array_map('trim', explode(',', env('CORS_ALLOWED_ORIGINS', 'http://localhost:8000,https://localhost:8000,http://meadadigital.com,https://meadadigital.com,http://www.meadadigital.com,https://www.meadadigital.com,http://framily.space,https://framily.space,http://www.framily.space,https://www.framily.space,http://netpilot.meadadigital.com,https://netpilot.meadadigital.com,http://bangalo.meadadigital.com,https://bangalo.meadadigital.com')))
    ),

    // Optional: regex patterns for origins (kept empty)
    'allowed_origins_patterns' => [],

    // Allowed headers
    'allowed_headers' => ['*'],

    // Headers exposed to the browser
    'exposed_headers' => [],

    // Preflight cache duration (seconds)
    'max_age' => 86400,

    // Important: allow cookies/auth headers across origins
    'supports_credentials' => true,
];
