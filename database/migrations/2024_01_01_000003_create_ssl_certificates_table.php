<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('ssl_certificates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('domain_id')->constrained()->onDelete('cascade');
            $table->string('domain_name'); // exemplo.com
            $table->json('san_domains')->nullable(); // ['www.exemplo.com', 'api.exemplo.com']
            $table->enum('status', ['pending', 'valid', 'expiring', 'expired', 'failed'])->default('pending');
            $table->string('issuer')->default("Let's Encrypt");
            $table->text('certificate_path')->nullable(); // Path to .crt file
            $table->text('private_key_path')->nullable(); // Path to .key file
            $table->text('chain_path')->nullable(); // Path to chain file
            $table->datetime('issued_at')->nullable();
            $table->datetime('expires_at')->nullable();
            $table->boolean('auto_renew')->default(true);
            $table->integer('renewal_days_before')->default(30); // Renew 30 days before expiry
            $table->json('traefik_config')->nullable(); // Generated Traefik config
            $table->text('last_error')->nullable();
            $table->timestamps();

            $table->index(['domain_id', 'status']);
            $table->index(['expires_at', 'auto_renew']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('ssl_certificates');
    }
};
