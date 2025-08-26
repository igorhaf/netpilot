<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Domain;
use App\Models\Upstream;
use App\Models\RouteRule;
use App\Models\RedirectRule;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Admin user
        User::query()->updateOrCreate(
            ['email' => 'admin@local'],
            [
                'name' => 'Admin',
                'password' => bcrypt('password'),
            ]
        );

        // Demo proxy data
        $domain = Domain::query()->updateOrCreate(
            ['name' => 'app.localtest.me'],
            [
                'description' => 'Demo application domain',
                'auto_tls' => false,
                'is_active' => true,
            ]
        );

        $upstream = Upstream::query()->updateOrCreate(
            ['domain_id' => $domain->id, 'name' => 'app-container'],
            [
                'target_url' => 'http://laravel.test:80',
                'weight' => 1,
                'is_active' => true,
                'health_check_path' => '/health',
                'health_check_interval' => 30,
                'description' => 'Main application container',
            ]
        );

        RouteRule::query()->updateOrCreate(
            ['domain_id' => $domain->id, 'upstream_id' => $upstream->id, 'path_pattern' => '/'],
            [
                'http_method' => '*',
                'priority' => 100,
                'is_active' => true,
                'strip_prefix' => false,
                'preserve_host' => true,
                'timeout' => 30,
            ]
        );

        RedirectRule::query()->updateOrCreate(
            ['domain_id' => $domain->id, 'source_pattern' => '/old'],
            [
                'target_url' => 'https://app.localtest.me/new',
                'redirect_type' => 301,
                'priority' => 100,
                'is_active' => true,
                'preserve_query' => true,
            ]
        );
    }
}
