<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('domains', function (Blueprint $table) {
            $table->softDeletes();
        });

        Schema::table('proxy_rules', function (Blueprint $table) {
            $table->softDeletes();
        });

        Schema::table('ssl_certificates', function (Blueprint $table) {
            $table->softDeletes();
        });
    }

    public function down()
    {
        Schema::table('domains', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });

        Schema::table('proxy_rules', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });

        Schema::table('ssl_certificates', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });
    }
};
