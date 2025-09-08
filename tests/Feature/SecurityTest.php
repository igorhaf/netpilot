<?php

namespace Tests\Feature;

use Tests\TestCase;

class SecurityTest extends TestCase
{
    public function test_rate_limiting(): void
    {
        for ($i = 0; $i < 100; $i++) {
            $response = $this->get('/');
            
            if ($i >= 60) {
                $response->assertStatus(429);
            } else {
                $response->assertStatus(302); // Expecting redirect to login
            }
        }
    }

    public function test_ip_filtering(): void
    {
        config(['security.ip_blacklist' => ['127.0.0.1']]);
        
        $response = $this->get('/');
        $response->assertStatus(403);
    }

    public function test_geo_blocking(): void
    {
        config(['security.allowed_countries' => ['US']]);
        
        // Simulate non-US IP
        $this->serverVariables = ['REMOTE_ADDR' => '1.1.1.1'];
        
        $response = $this->get('/');
        $response->assertStatus(403);
    }
}
