<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;

class ResetDatabase extends Command
{
    protected $signature = 'db:reset';
    protected $description = 'Reset database with fresh migrations and seeders';

    public function handle(): int
    {
        $this->info('Resetting database...');

        try {
            // Drop all tables
            DB::statement('PRAGMA foreign_keys = OFF');
            $tables = DB::select("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
            
            foreach ($tables as $table) {
                DB::statement("DROP TABLE IF EXISTS {$table->name}");
            }
            
            DB::statement('PRAGMA foreign_keys = ON');
            $this->info('Dropped all tables');

            // Run migrations
            Artisan::call('migrate', ['--force' => true]);
            $this->info('Migrations completed');

            // Run seeders
            Artisan::call('db:seed', ['--force' => true]);
            $this->info('Seeders completed');

            $this->info('Database reset successfully!');
            return self::SUCCESS;

        } catch (\Exception $e) {
            $this->error('Database reset failed: ' . $e->getMessage());
            return self::FAILURE;
        }
    }
}
