<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Tenant;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create default tenant first
        Tenant::query()->updateOrCreate(
            ['slug' => 'default'],
            [
                'name' => 'Default Tenant',
                'is_active' => true,
            ]
        );

        // Admin user
        User::query()->updateOrCreate(
            ['email' => 'admin@local'],
            [
                'name' => 'Admin',
                'password' => bcrypt('password'),
            ]
        );

        // Call NetPilot seeder for real data
        $this->call([
            NetPilotSeeder::class,
        ]);
    }
}
