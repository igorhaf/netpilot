<?php

namespace Database\Factories;

use App\Models\Domain;
use Illuminate\Database\Eloquent\Factories\Factory;

class DomainFactory extends Factory
{
    protected $model = Domain::class;

    public function definition()
    {
        return [
            'tenant_id' => \App\Models\Tenant::factory(),
            'name' => $this->faker->domainName,
            'description' => $this->faker->sentence,
            'is_active' => true,
            'auto_ssl' => false,
            'force_https' => false,
            'block_external_access' => false,
            'www_redirect' => false,
            'www_redirect_type' => 'www_to_non_www',
            'security_headers' => false,
        ];
    }
}
