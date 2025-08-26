<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('redirect_rules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('domain_id')->constrained()->onDelete('cascade');
            $table->string('source_pattern'); // /old-path, /api/v1/*
            $table->string('target_url'); // https://exemplo.com/new-path
            $table->integer('redirect_type')->default(301); // 301, 302, 307, 308
            $table->integer('priority')->default(100);
            $table->boolean('is_active')->default(true);
            $table->boolean('preserve_query')->default(true); // Manter query strings
            $table->json('conditions')->nullable(); // Condições extras (user-agent, etc)
            $table->text('nginx_config')->nullable(); // Generated nginx config
            $table->timestamps();
            
            $table->index(['domain_id', 'is_active']);
            $table->index(['source_pattern', 'priority']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('redirect_rules');
    }
};
