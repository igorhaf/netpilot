<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('deployment_logs', function (Blueprint $table) {
            $table->id();
            $table->string('type'); // Changed from enum to string to allow more types
            $table->string('action'); // deploy, reload, renew, update, create, delete
            $table->enum('status', ['pending', 'running', 'success', 'failed'])->default('pending');
            $table->json('payload')->nullable(); // Configuration data
            $table->text('output')->nullable(); // Command output
            $table->text('error')->nullable(); // Error message
            $table->datetime('started_at')->nullable();
            $table->datetime('completed_at')->nullable();
            $table->timestamps();

            $table->index(['type', 'status']);
            $table->index('created_at');
        });
    }

    public function down()
    {
        Schema::dropIfExists('deployment_logs');
    }
};
