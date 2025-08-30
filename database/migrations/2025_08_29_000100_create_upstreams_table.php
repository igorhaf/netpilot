<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('upstreams', function (Blueprint $table) {
            $table->id();
            $table->foreignId('domain_id')->constrained()->onDelete('cascade');
            $table->string('name');
            $table->string('target_url');
            $table->integer('weight')->default(1);
            $table->boolean('is_active')->default(true);
            $table->string('health_check_path')->nullable();
            $table->integer('health_check_interval')->default(30);
            $table->string('description')->nullable();
            $table->timestamps();

            $table->index(['domain_id', 'is_active']);
            $table->unique(['domain_id', 'name']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('upstreams');
    }
};
