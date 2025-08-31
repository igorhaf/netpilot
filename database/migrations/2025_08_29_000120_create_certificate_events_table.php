<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('certificate_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('domain_id')->constrained()->onDelete('cascade');
            $table->string('event_type'); // issued, renewed, revoked, error
            $table->string('status');     // success, failed, pending
            $table->string('domain');     // cached domain name at the time
            $table->json('payload')->nullable();
            $table->timestamps();

            $table->index(['domain_id', 'event_type']);
            $table->index(['status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('certificate_events');
    }
};
