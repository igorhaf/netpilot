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
            'name' => $this->faker->domainName,
            'description' => $this->faker->sentence,
            'is_active' => true,
        ];
    }
}
