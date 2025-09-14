<?php

namespace Database\Factories;

use App\Models\Upstream;
use App\Models\Domain;
use Illuminate\Database\Eloquent\Factories\Factory;

class UpstreamFactory extends Factory
{
    protected $model = Upstream::class;

    public function definition()
    {
        return [
            'tenant_id' => \App\Models\Tenant::factory(),
            'domain_id' => Domain::factory(),
            'name' => $this->faker->slug(2),
            'target_url' => 'http://localhost:' . $this->faker->numberBetween(3000, 9000),
            'weight' => 1,
            'is_active' => true,
            'health_check_interval' => 30,
        ];
    }
}
