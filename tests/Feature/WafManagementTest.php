<?php

namespace Tests\Feature;

use App\Services\CloudflareWafService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery;
use Tests\TestCase;

class WafManagementTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->mock(CloudflareWafService::class, function ($mock) {
            $mock->shouldReceive('createRule')->andReturn(['success' => true]);
            $mock->shouldReceive('updateRule')->andReturn(['success' => true]);
        });
    }

    public function test_waf_rule_creation(): void
    {
        $user = \App\Models\User::factory()->create();
        
        $response = $this->actingAs($user)
            ->post('/waf', [
                'name' => 'Block XSS',
                'expression' => 'http.request.uri contains "<script>"'
            ]);
            
        $response->assertRedirect();
        $response->assertSessionHas('success');
    }

    public function test_waf_rule_update(): void
    {
        $user = \App\Models\User::factory()->create();
        $ruleId = 'cf-rule-123';
        
        $response = $this->actingAs($user)
            ->put("/waf/{$ruleId}", [
                'expression' => 'http.request.uri contains "<script>" or http.request.uri contains "javascript:"'
            ]);
            
        $response->assertRedirect();
        $response->assertSessionHas('success');
    }
}
