<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('domains', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->text('description')->nullable();
            $table->boolean('auto_tls')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('upstreams', function (Blueprint $table) {
            $table->id();
            $table->foreignId('domain_id')->constrained('domains')->cascadeOnDelete();
            $table->string('name');
            $table->string('target_url');
            $table->integer('weight')->default(1);
            $table->boolean('is_active')->default(true);
            $table->string('health_check_path')->nullable();
            $table->integer('health_check_interval')->default(30);
            $table->text('description')->nullable();
            $table->timestamps();
        });

        Schema::create('route_rules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('domain_id')->constrained('domains')->cascadeOnDelete();
            $table->foreignId('upstream_id')->constrained('upstreams')->cascadeOnDelete();
            $table->string('path_pattern')->default('/');
            $table->string('http_method')->default('*');
            $table->integer('priority')->default(100);
            $table->boolean('is_active')->default(true);
            $table->boolean('strip_prefix')->default(false);
            $table->boolean('preserve_host')->default(true);
            $table->integer('timeout')->default(30);
            $table->timestamps();
        });

        Schema::create('redirect_rules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('domain_id')->constrained('domains')->cascadeOnDelete();
            $table->string('source_pattern')->nullable();
            $table->string('target_url');
            $table->integer('redirect_type')->default(302);
            $table->integer('priority')->default(100);
            $table->boolean('is_active')->default(true);
            $table->boolean('preserve_query')->default(true);
            $table->timestamps();
        });

        Schema::create('certificate_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('domain_id')->constrained('domains')->cascadeOnDelete();
            $table->enum('event_type', ['REQUEST', 'RENEW', 'ERROR']);
            $table->enum('status', ['SUCCESS', 'FAILED'])->default('SUCCESS');
            $table->string('domain');
            $table->json('payload')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('certificate_events');
        Schema::dropIfExists('redirect_rules');
        Schema::dropIfExists('route_rules');
        Schema::dropIfExists('upstreams');
        Schema::dropIfExists('domains');
    }
};
