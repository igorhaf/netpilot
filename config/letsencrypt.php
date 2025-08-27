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

    'email' => env('LETSENCRYPT_EMAIL', 'admin@localhost'),
    
    'acme_path' => env('LETSENCRYPT_ACME_PATH', '/etc/letsencrypt'),
    
    'certificates_path' => env('LETSENCRYPT_CERTS_PATH', '/etc/letsencrypt/live'),
    
    'staging' => env('LETSENCRYPT_STAGING', false),
    
    'webroot_path' => env('LETSENCRYPT_WEBROOT', '/var/www/html/.well-known/acme-challenge'),
    
    'challenge_method' => env('LETSENCRYPT_CHALLENGE', 'standalone'), // standalone, webroot, dns
    
    'key_size' => env('LETSENCRYPT_KEY_SIZE', 2048),
    
    'renewal_days_before' => env('LETSENCRYPT_RENEWAL_DAYS', 30),
    
    'auto_renew' => env('LETSENCRYPT_AUTO_RENEW', true),
    
    'certbot_path' => env('CERTBOT_PATH', '/usr/bin/certbot'),
];
