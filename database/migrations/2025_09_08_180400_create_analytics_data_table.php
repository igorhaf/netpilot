<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('analytics_data', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('type'); // request, event, etc
            $table->string('key'); // route/event name
            $table->float('value'); // duration/count/etc
            $table->json('metadata')->nullable(); // additional context
            $table->timestamps();
            
            $table->index(['tenant_id', 'type', 'key']);
            $table->index('created_at');
        });
    }

    public function down()
    {
        Schema::dropIfExists('analytics_data');
    }
};
