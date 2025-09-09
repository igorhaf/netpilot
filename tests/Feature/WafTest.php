<?php

namespace Tests\Feature;

use Tests\TestCase;

class WafTest extends TestCase
{
    public function test_waf_blocking_malicious_request(): void
    {
        $response = $this->get('/?<script>alert(1)</script>');
        $response->assertStatus(403);
    }

    public function test_waf_allowing_legitimate_request(): void
    {
        $response = $this->get('/');
        $response->assertStatus(302); // Redirect to login
    }
}
