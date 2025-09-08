<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Add a composite unique index to ensure unique upstream name per domain
        Schema::table('upstreams', function (Blueprint $table) {
            if (!Schema::hasIndex('upstreams', 'upstreams_domain_id_name_unique')) {
                $table->unique(['domain_id', 'name'], 'upstreams_domain_id_name_unique');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('upstreams', function (Blueprint $table) {
            $table->dropUnique('upstreams_domain_id_name_unique');
        });
    }
};
