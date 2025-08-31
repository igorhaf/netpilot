<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('route_rules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('domain_id')->constrained()->onDelete('cascade');
            $table->foreignId('upstream_id')->constrained()->onDelete('cascade');
            $table->string('path_pattern')->nullable();
            $table->string('http_method')->default('*');
            $table->integer('priority')->default(100);
            $table->boolean('is_active')->default(true);
            $table->boolean('strip_prefix')->default(false);
            $table->boolean('preserve_host')->default(true);
            $table->integer('timeout')->default(30);
            $table->string('description')->nullable();
            $table->timestamps();

            $table->index(['domain_id', 'is_active']);
            $table->index(['upstream_id']);
            $table->index(['http_method']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('route_rules');
    }
};
