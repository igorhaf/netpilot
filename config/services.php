<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'resend' => [
        'key' => env('RESEND_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'dns' => [
        'default' => env('DNS_PROVIDER', 'cloudflare'),
        
        'cloudflare' => [
            'api_key' => env('CLOUDFLARE_API_KEY'),
            'email' => env('CLOUDFLARE_EMAIL'),
        ],
        
        'aws' => [
            'key' => env('AWS_ACCESS_KEY_ID'),
            'secret' => env('AWS_SECRET_ACCESS_KEY'),
            'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
        ],
        
        'digitalocean' => [
            'token' => env('DIGITALOCEAN_TOKEN'),
        ],
    ],
    
    'monitoring' => [
        'default' => env('MONITORING_PROVIDER', 'prometheus'),
        
        'prometheus' => [
            'url' => env('PROMETHEUS_URL', 'http://localhost:9090'),
        ],
        
        'datadog' => [
            'api_key' => env('DATADOG_API_KEY'),
            'app_key' => env('DATADOG_APP_KEY'),
        ],
        
        'newrelic' => [
            'license_key' => env('NEWRELIC_LICENSE_KEY'),
            'account_id' => env('NEWRELIC_ACCOUNT_ID'),
        ],
    ],
    
    'notifications' => [
        'default' => env('NOTIFICATION_CHANNEL', 'mail'),
        
        'mail' => [
            'driver' => env('MAIL_MAILER'),
            'from' => env('MAIL_FROM_ADDRESS'),
        ],
        
        'slack' => [
            'webhook' => env('SLACK_WEBHOOK_URL'),
            'channel' => env('SLACK_CHANNEL', '#alerts'),
        ],
        
        'sms' => [
            'provider' => env('SMS_PROVIDER', 'twilio'),
            'twilio_sid' => env('TWILIO_SID'),
            'twilio_token' => env('TWILIO_TOKEN'),
            'twilio_from' => env('TWILIO_FROM_NUMBER'),
        ],
    ],
    
    'cloudflare' => [
        'api_key' => env('CLOUDFLARE_API_KEY'),
        'zone_id' => env('CLOUDFLARE_ZONE_ID'),
    ],
];
