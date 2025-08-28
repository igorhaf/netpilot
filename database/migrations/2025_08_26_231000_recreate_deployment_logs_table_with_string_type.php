<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        // Drop the existing table
        Schema::dropIfExists('deployment_logs');
        
        // Recreate with string type instead of enum
        Schema::create('deployment_logs', function (Blueprint $table) {
            $table->id();
            $table->string('type'); // Allow any string type
            $table->string('action');
            $table->enum('status', ['pending', 'running', 'success', 'failed'])->default('pending');
            $table->json('payload')->nullable();
            $table->text('output')->nullable();
            $table->text('error')->nullable();
            $table->datetime('started_at')->nullable();
            $table->datetime('completed_at')->nullable();
            $table->timestamps();

            $table->index(['type', 'status']);
            $table->index('created_at');
        });
    }

    public function down()
    {
        // Recreate the original table structure
        Schema::dropIfExists('deployment_logs');
        
        Schema::create('deployment_logs', function (Blueprint $table) {
            $table->id();
            $table->enum('type', ['nginx', 'traefik', 'ssl_renewal', 'proxy_update']);
            $table->string('action');
            $table->enum('status', ['pending', 'running', 'success', 'failed'])->default('pending');
            $table->json('payload')->nullable();
            $table->text('output')->nullable();
            $table->text('error')->nullable();
            $table->datetime('started_at')->nullable();
            $table->datetime('completed_at')->nullable();
            $table->timestamps();

            $table->index(['type', 'status']);
            $table->index('created_at');
        });
    }
};
