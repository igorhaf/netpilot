<?php

namespace Database\Factories;

use App\Models\SslCertificate;
use App\Models\Domain;
use Illuminate\Database\Eloquent\Factories\Factory;

class SslCertificateFactory extends Factory
{
    protected $model = SslCertificate::class;

    public function definition()
    {
        return [
            'tenant_id' => \App\Models\Tenant::factory(),
            'domain_id' => Domain::factory(),
            'domain_name' => $this->faker->domainName,
            'status' => 'pending',
            'auto_renew' => true,
            'expires_at' => now()->addDays(90),
        ];
    }
}
