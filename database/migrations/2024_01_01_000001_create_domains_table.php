<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('domains', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique(); // exemplo.com
            $table->string('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->boolean('auto_ssl')->default(true); // Auto SSL via Let's Encrypt
            $table->json('dns_records')->nullable(); // A, CNAME, etc.
            $table->timestamps();

            $table->index(['name', 'is_active']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('domains');
    }
};
