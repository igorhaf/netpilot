<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('proxy_rules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('domain_id')->constrained()->onDelete('cascade');
            $table->string('source_host'); // www.exemplo.com
            $table->string('source_port')->default('80'); // 80, 443, 8080
            $table->string('target_host')->default('localhost'); // localhost, 192.168.1.10
            $table->string('target_port'); // 8080, 3000, 80
            $table->string('protocol')->default('http'); // http, https
            $table->json('headers')->nullable(); // Custom headers
            $table->integer('priority')->default(100);
            $table->boolean('is_active')->default(true);
            $table->text('nginx_config')->nullable(); // Generated nginx config
            $table->timestamps();

            $table->index(['domain_id', 'is_active']);
            $table->index(['source_host', 'source_port']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('proxy_rules');
    }
};
