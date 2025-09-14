<?php

namespace Tests\Feature;

use App\Models\Domain;
use App\Models\SslCertificate;
use App\Models\User;
use App\Services\LetsEncryptService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SslCertificateManagementTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private LetsEncryptService $letsEncryptService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        $this->letsEncryptService = app(LetsEncryptService::class);
    }

    /** @test */
    public function can_issue_ssl_certificate_for_domain()
    {
        $domain = Domain::factory()->create([
            'name' => 'test.example.com',
            'auto_ssl' => true,
        ]);

        $certificate = SslCertificate::factory()->create([
            'domain_id' => $domain->id,
            'domain_name' => $domain->name,
            'status' => 'pending',
        ]);

        $result = $this->letsEncryptService->issueCertificate($certificate);

        $this->assertTrue($result['success']);
        $certificate->refresh();
        $this->assertEquals('valid', $certificate->status);
        $this->assertNotNull($certificate->certificate_path);
        $this->assertNotNull($certificate->private_key_path);
    }

    /** @test */
    public function can_renew_ssl_certificate()
    {
        $domain = Domain::factory()->create(['name' => 'test.example.com']);
        
        $certificate = SslCertificate::factory()->create([
            'domain_id' => $domain->id,
            'domain_name' => $domain->name,
            'status' => 'valid',
            'expires_at' => now()->addDays(30), // Expiring soon
        ]);

        $result = $this->letsEncryptService->renewCertificate($certificate);

        $this->assertTrue($result['success']);
        $certificate->refresh();
        $this->assertEquals('valid', $certificate->status);
        $this->assertTrue($certificate->expires_at->gt(now()->addDays(80)));
    }

    /** @test */
    public function can_revoke_ssl_certificate()
    {
        $domain = Domain::factory()->create(['name' => 'test.example.com']);
        
        $certificate = SslCertificate::factory()->create([
            'domain_id' => $domain->id,
            'domain_name' => $domain->name,
            'status' => 'valid',
        ]);

        $result = $this->letsEncryptService->revokeCertificate($certificate);

        $this->assertTrue($result['success']);
        $certificate->refresh();
        $this->assertEquals('revoked', $certificate->status);
        $this->assertNotNull($certificate->revoked_at);
    }

    /** @test */
    public function can_check_certificate_status()
    {
        $domain = Domain::factory()->create(['name' => 'test.example.com']);
        
        $certificate = SslCertificate::factory()->create([
            'domain_id' => $domain->id,
            'domain_name' => $domain->name,
            'status' => 'valid',
            'expires_at' => now()->addDays(60),
        ]);

        // First issue the certificate to create files
        $this->letsEncryptService->issueCertificate($certificate);
        
        $status = $this->letsEncryptService->checkCertificateStatus($certificate);

        $this->assertTrue($status['valid']);
        $this->assertNotNull($status['expires_at']);
        $this->assertNotNull($status['days_until_expiry']);
    }

    /** @test */
    public function ssl_certificate_api_endpoints_work()
    {
        $domain = Domain::factory()->create(['name' => 'test.example.com']);

        // Test create SSL certificate
        $sslData = [
            'domain_id' => $domain->id,
            'domain_name' => $domain->name,
            'auto_renew' => true,
        ];

        $response = $this->actingAs($this->user)
            ->postJson('/ssl', $sslData);

        $response->assertStatus(201);
        
        $certificate = SslCertificate::where('domain_name', $domain->name)->first();
        $this->assertNotNull($certificate);

        // Test renew certificate
        $response = $this->actingAs($this->user)
            ->postJson("/ssl/{$certificate->id}/renew");

        $response->assertStatus(200);

        // Test toggle certificate
        $response = $this->actingAs($this->user)
            ->postJson("/ssl/{$certificate->id}/toggle");

        $response->assertStatus(200);

        // Test delete certificate
        $response = $this->actingAs($this->user)
            ->deleteJson("/ssl/{$certificate->id}");

        $response->assertStatus(204);
    }

    /** @test */
    public function can_cleanup_expired_certificates()
    {
        // Create expired certificate
        $expiredCert = SslCertificate::factory()->create([
            'domain_name' => 'expired.example.com',
            'status' => 'expired',
            'auto_renew' => false,
            'expires_at' => now()->subDays(10),
        ]);

        // Create valid certificate
        $validCert = SslCertificate::factory()->create([
            'domain_name' => 'valid.example.com',
            'status' => 'valid',
            'expires_at' => now()->addDays(60),
        ]);

        $result = $this->letsEncryptService->cleanupExpiredCertificates();

        $this->assertEquals(1, $result['cleaned']);
        $this->assertEmpty($result['errors']);
        
        $this->assertDatabaseMissing('ssl_certificates', ['id' => $expiredCert->id]);
        $this->assertDatabaseHas('ssl_certificates', ['id' => $validCert->id]);
    }
}
