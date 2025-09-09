<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Domain;

class DomainManagementTest extends TestCase
{
    public function test_domain_creation()
    {
        $response = $this->post('/domains', [
            'name' => 'example.com',
            'description' => 'Test domain',
            'is_active' => true
        ]);
        
        $response->assertRedirect();
        $this->assertDatabaseHas('domains', ['name' => 'example.com']);
    }

    public function test_domain_deletion()
    {
        $domain = Domain::factory()->create();
        
        $response = $this->delete("/domains/{$domain->id}");
        
        $response->assertRedirect();
        $this->assertDatabaseMissing('domains', ['id' => $domain->id]);
    }
}
