<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Tenant;
use App\Models\Domain;
use App\Models\Upstream;
use App\Models\RouteRule;
use App\Models\RedirectRule;
use App\Models\SslCertificate;

class NetPilotDomainSeeder extends Seeder
{
    /**
     * Seed the NetPilot main domain configuration
     */
    public function run(): void
    {
        // Create or get production tenant
        $tenant = Tenant::firstOrCreate([
            'slug' => 'netpilot-production'
        ], [
            'name' => 'NetPilot Production',
            'is_active' => true
        ]);

        $this->command->info("✅ Tenant created: {$tenant->name}");

        // Create netpilot.meadadigital.com domain
        $domain = Domain::firstOrCreate([
            'name' => 'netpilot.meadadigital.com'
        ], [
            'tenant_id' => $tenant->id,
            'description' => 'NetPilot main system domain',
            'is_active' => true,
            'auto_ssl' => true,
            'www_redirect' => true,
            'www_redirect_type' => 'www_to_non_www',
            'force_https' => true,
            'block_external_access' => true, // Block direct port access
            'internal_bind_ip' => '127.0.0.1',
            'security_headers' => [
                'X-Frame-Options' => 'DENY',
                'X-Content-Type-Options' => 'nosniff',
                'X-XSS-Protection' => '1; mode=block',
                'Strict-Transport-Security' => 'max-age=31536000; includeSubDomains'
            ]
        ]);

        $this->command->info("✅ Domain created: {$domain->name}");

        // Create upstream for localhost:8484 (NetPilot system)
        $upstream = Upstream::firstOrCreate([
            'name' => 'netpilot-system',
            'tenant_id' => $tenant->id,
            'domain_id' => $domain->id
        ], [
            'description' => 'NetPilot system backend service',
            'target_url' => 'http://localhost:8484',
            'weight' => 100,
            'is_active' => true,
            'health_check_path' => '/health',
            'health_check_interval' => 30
        ]);

        $this->command->info("✅ Upstream created: {$upstream->name} -> {$upstream->target_url}");

        // Create main route rule for all traffic
        $mainRoute = RouteRule::firstOrCreate([
            'domain_id' => $domain->id,
            'upstream_id' => $upstream->id,
            'path_pattern' => '/'
        ], [
            'tenant_id' => $tenant->id,
            'http_method' => '*', // Accept all HTTP methods
            'priority' => 100,
            'is_active' => true,
            'strip_prefix' => false,
            'preserve_host' => true,
            'timeout' => 30
        ]);

        $this->command->info("✅ Main route created: {$mainRoute->path_pattern} (Priority: {$mainRoute->priority})");

        // Create API route rule with higher priority
        $apiRoute = RouteRule::firstOrCreate([
            'domain_id' => $domain->id,
            'upstream_id' => $upstream->id,
            'path_pattern' => '/api'
        ], [
            'tenant_id' => $tenant->id,
            'http_method' => '*',
            'priority' => 200,
            'is_active' => true,
            'strip_prefix' => false,
            'preserve_host' => true,
            'timeout' => 60
        ]);

        $this->command->info("✅ API route created: {$apiRoute->path_pattern} (Priority: {$apiRoute->priority})");

        // Create redirect rule for www to non-www
        $wwwRedirect = RedirectRule::firstOrCreate([
            'domain_id' => $domain->id,
            'source_pattern' => 'www.netpilot.meadadigital.com'
        ], [
            'tenant_id' => $tenant->id,
            'target_url' => 'https://netpilot.meadadigital.com',
            'redirect_type' => 301,
            'priority' => 100,
            'is_active' => true,
            'preserve_query' => true
        ]);

        $this->command->info("✅ WWW redirect created: {$wwwRedirect->source_pattern} -> {$wwwRedirect->target_url}");

        // Create redirect rule to block direct port access
        $portBlockRedirect = RedirectRule::firstOrCreate([
            'domain_id' => $domain->id,
            'source_pattern' => 'netpilot.meadadigital.com:8484'
        ], [
            'tenant_id' => $tenant->id,
            'target_url' => 'https://netpilot.meadadigital.com',
            'redirect_type' => 301,
            'priority' => 150,
            'is_active' => true,
            'preserve_query' => false
        ]);

        $this->command->info("✅ Port block redirect created: {$portBlockRedirect->source_pattern} -> {$portBlockRedirect->target_url}");

        // Create SSL certificate
        $ssl = SslCertificate::firstOrCreate([
            'domain_id' => $domain->id,
            'domain_name' => 'netpilot.meadadigital.com'
        ], [
            'tenant_id' => $tenant->id,
            'san_domains' => ['www.netpilot.meadadigital.com'],
            'auto_renew' => true,
            'renewal_days_before' => 30,
            'status' => 'pending',
            'issuer' => 'letsencrypt'
        ]);

        $this->command->info("✅ SSL certificate created: {$ssl->domain_name} (SAN: " . implode(', ', $ssl->san_domains ?? []) . ")");

        // Sync Traefik configuration
        $this->command->info("🔄 Synchronizing Traefik configuration...");
        
        try {
            \Artisan::call('proxy:sync');
            $this->command->info("✅ Traefik configuration synchronized successfully");
        } catch (\Exception $e) {
            $this->command->error("❌ Failed to sync Traefik configuration: " . $e->getMessage());
        }

        $this->command->newLine();
        $this->command->info("🎉 NetPilot domain seeding completed successfully!");
        $this->command->info("📋 Configuration Summary:");
        $this->command->info("   • Domain: netpilot.meadadigital.com");
        $this->command->info("   • Backend: localhost:8484");
        $this->command->info("   • HTTPS: Forced (HTTP -> HTTPS redirect)");
        $this->command->info("   • WWW: Redirects to apex domain");
        $this->command->info("   • Port Access: Blocked (netpilot.meadadigital.com:8484 -> netpilot.meadadigital.com)");
        $this->command->info("   • SSL: Let's Encrypt with auto-renewal");
        $this->command->info("   • Security: Enhanced headers enabled");
        $this->command->newLine();
    }
}
