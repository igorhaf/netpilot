<?php

return [
    /*
    |--------------------------------------------------------------------------
    | IP Filtering
    |--------------------------------------------------------------------------
    */
    'ip_whitelist' => env('IP_WHITELIST', '')
        ? explode(',', env('IP_WHITELIST')) 
        : [],
        
    'ip_blacklist' => env('IP_BLACKLIST', '')
        ? explode(',', env('IP_BLACKLIST')) 
        : [],
        
    /*
    |--------------------------------------------------------------------------
    | Geo-Blocking
    |--------------------------------------------------------------------------
    */
    'allowed_countries' => env('ALLOWED_COUNTRIES', '')
        ? explode(',', env('ALLOWED_COUNTRIES'))
        : [],
];
