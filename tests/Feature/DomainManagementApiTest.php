<?php

namespace Tests\Feature;

use App\Models\Domain;
use App\Models\Upstream;
use App\Models\RouteRule;
use App\Models\SslCertificate;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class DomainManagementApiTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private \App\Models\Tenant $tenant;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        
        // Create default tenant
        $this->tenant = \App\Models\Tenant::create([
            'name' => 'Default Tenant',
            'slug' => 'default',
            'is_active' => true
        ]);
    }

    /** @test */
    public function can_create_domain_with_security_settings()
    {
        $domainData = [
            'name' => 'test.example.com',
            'description' => 'Test domain',
            'is_active' => true,
            'auto_ssl' => true,
            'force_https' => true,
            'block_external_access' => false,
            'www_redirect' => true,
            'www_redirect_type' => 'www_to_non_www',
            'internal_bind_ip' => '127.0.0.1',
            'security_headers' => true,
            'tenant_id' => $this->tenant->id,
        ];

        $domain = Domain::create($domainData);
        
        $this->assertDatabaseHas('domains', [
            'name' => 'test.example.com',
            'force_https' => true,
            'www_redirect' => true,
            'www_redirect_type' => 'www_to_non_www',
        ]);
    }

    /** @test */
    public function can_update_domain_security_settings()
    {
        $domain = Domain::factory()->create([
            'name' => 'test.example.com',
            'force_https' => false,
            'www_redirect' => false,
            'tenant_id' => $this->tenant->id,
        ]);

        $updateData = [
            'name' => 'test.example.com',
            'description' => 'Updated test domain',
            'force_https' => true,
            'www_redirect' => true,
            'www_redirect_type' => 'non_www_to_www',
            'block_external_access' => true,
            'tenant_id' => $this->tenant->id,
        ];

        $response = $this->actingAs($this->user)
            ->putJson("/domains/{$domain->id}", $updateData);

        $response->assertStatus(200);
        
        $domain->refresh();
        $this->assertTrue($domain->force_https);
        $this->assertTrue($domain->www_redirect);
        $this->assertEquals('non_www_to_www', $domain->www_redirect_type);
        $this->assertTrue($domain->block_external_access);
    }

    /** @test */
    public function can_create_upstream_for_domain()
    {
        $domain = Domain::factory()->create([
            'name' => 'test.example.com',
            'tenant_id' => $this->tenant->id,
        ]);

        $upstreamData = [
            'domain_id' => $domain->id,
            'name' => 'main-upstream',
            'target_url' => 'http://localhost:8989',
            'weight' => 1,
            'is_active' => true,
            'tenant_id' => $this->tenant->id,
        ];

        $response = $this->actingAs($this->user)
            ->postJson('/upstreams', $upstreamData);

        $response->assertStatus(201);
        
        $this->assertDatabaseHas('upstreams', [
            'domain_id' => $domain->id,
            'name' => 'main-upstream',
            'target_url' => 'http://localhost:8989',
        ]);
    }

    /** @test */
    public function can_create_route_rule_for_domain()
    {
        $domain = Domain::factory()->create([
            'name' => 'test.example.com',
            'tenant_id' => $this->tenant->id,
        ]);
        $upstream = Upstream::factory()->create([
            'domain_id' => $domain->id,
            'name' => 'main-upstream',
            'tenant_id' => $this->tenant->id,
        ]);

        $routeData = [
            'domain_id' => $domain->id,
            'upstream_id' => $upstream->id,
            'path_pattern' => '/',
            'http_method' => 'GET',
            'priority' => 100,
            'is_active' => true,
            'tenant_id' => $this->tenant->id,
        ];

        $response = $this->actingAs($this->user)
            ->postJson('/routes', $routeData);

        $response->assertStatus(201);
        
        $this->assertDatabaseHas('route_rules', [
            'domain_id' => $domain->id,
            'upstream_id' => $upstream->id,
            'path_pattern' => '/',
            'priority' => 100,
        ]);
    }

    /** @test */
    public function can_generate_ssl_certificate_for_domain()
    {
        // Mock the LetsEncryptService to avoid actual SSL certificate issuance in tests
        $this->mock(\App\Services\LetsEncryptService::class, function ($mock) {
            $mock->shouldReceive('issueCertificate')->once()->andReturn([]);
        });

        $domain = Domain::factory()->create([
            'name' => 'test.example.com',
            'auto_ssl' => true,
            'tenant_id' => $this->tenant->id,
        ]);

        $sslData = [
            'domain_id' => $domain->id,
            'domain_name' => $domain->name,
            'auto_renew' => true,
            'renewal_days_before' => 30,
            'tenant_id' => $this->tenant->id,
        ];

        $response = $this->actingAs($this->user)
            ->postJson('/ssl', $sslData);

        $response->assertStatus(201);
        
        $this->assertDatabaseHas('ssl_certificates', [
            'domain_id' => $domain->id,
            'domain_name' => $domain->name,
            'auto_renew' => true,
        ]);
    }

    /** @test */
    public function proxy_sync_generates_traefik_config()
    {
        $domain = Domain::factory()->create([
            'name' => 'test.example.com',
            'is_active' => true,
            'force_https' => true,
            'www_redirect' => true,
            'www_redirect_type' => 'www_to_non_www',
            'tenant_id' => $this->tenant->id,
        ]);

        $upstream = Upstream::factory()->create([
            'domain_id' => $domain->id,
            'target_url' => 'http://localhost:8989',
            'tenant_id' => $this->tenant->id,
        ]);

        RouteRule::factory()->create([
            'domain_id' => $domain->id,
            'upstream_id' => $upstream->id,
            'path_pattern' => '/',
            'priority' => 100,
            'is_active' => true,
            'tenant_id' => $this->tenant->id,
        ]);

        $response = $this->actingAs($this->user)
            ->postJson('/sync');

        $response->assertStatus(200);
        
        // Verify Traefik config file was generated
        $configPath = base_path('traefik/dynamic/routes-test_example_com.yml');
        $this->assertFileExists($configPath);
        
        $configContent = file_get_contents($configPath);
        $this->assertStringContainsString('test.example.com', $configContent);
        $this->assertStringContainsString('redirectScheme', $configContent);
        $this->assertStringContainsString('https', $configContent);
    }

    /** @test */
    public function validates_domain_name_format()
    {
        $invalidDomainData = [
            'name' => 'invalid-domain-name',  // This should fail domain validation
            'description' => 'Invalid domain',
            'tenant_id' => $this->tenant->id,
        ];

        $response = $this->actingAs($this->user)
            ->postJson('/domains', $invalidDomainData);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['name']);
    }

    /** @test */
    public function validates_www_redirect_type_values()
    {
        $invalidRedirectData = [
            'name' => 'test.example.com',
            'www_redirect' => true,
            'www_redirect_type' => 'invalid_type',
            'tenant_id' => $this->tenant->id,
        ];

        $response = $this->actingAs($this->user)
            ->postJson('/domains', $invalidRedirectData);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['www_redirect_type']);
    }

    /** @test */
    public function can_delete_domain_and_cleanup_resources()
    {
        $domain = Domain::factory()->create([
            'name' => 'test.example.com',
            'tenant_id' => $this->tenant->id,
        ]);
        $upstream = Upstream::factory()->create([
            'domain_id' => $domain->id,
            'tenant_id' => $this->tenant->id,
        ]);
        $route = RouteRule::factory()->create([
            'domain_id' => $domain->id,
            'tenant_id' => $this->tenant->id,
        ]);
        $ssl = SslCertificate::factory()->create([
            'domain_id' => $domain->id,
            'tenant_id' => $this->tenant->id,
        ]);

        $response = $this->actingAs($this->user)
            ->deleteJson("/domains/{$domain->id}");

        $response->assertStatus(204);
        
        $this->assertDatabaseMissing('domains', ['id' => $domain->id]);
        $this->assertDatabaseMissing('upstreams', ['id' => $upstream->id]);
        $this->assertDatabaseMissing('route_rules', ['id' => $route->id]);
        $this->assertDatabaseMissing('ssl_certificates', ['id' => $ssl->id]);
    }
}
