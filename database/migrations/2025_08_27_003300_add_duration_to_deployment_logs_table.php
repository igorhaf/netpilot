<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('deployment_logs', function (Blueprint $table) {
            $table->integer('duration')->nullable()->after('completed_at');
        });
    }

    public function down()
    {
        Schema::table('deployment_logs', function (Blueprint $table) {
            $table->dropColumn('duration');
        });
    }
};
