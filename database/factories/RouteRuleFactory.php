<?php

namespace Database\Factories;

use App\Models\RouteRule;
use App\Models\Domain;
use App\Models\Upstream;
use Illuminate\Database\Eloquent\Factories\Factory;

class RouteRuleFactory extends Factory
{
    protected $model = RouteRule::class;

    public function definition()
    {
        return [
            'tenant_id' => \App\Models\Tenant::factory(),
            'domain_id' => Domain::factory(),
            'upstream_id' => Upstream::factory(),
            'path_pattern' => '/',
            'http_method' => 'GET',
            'priority' => $this->faker->numberBetween(1, 1000),
            'is_active' => true,
            'strip_prefix' => false,
            'preserve_host' => true,
            'timeout' => 30,
        ];
    }
}
