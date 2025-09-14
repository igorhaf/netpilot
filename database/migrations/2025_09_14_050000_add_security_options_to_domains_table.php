<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('domains', function (Blueprint $table) {
            $table->boolean('force_https')->default(true)->after('auto_ssl'); // Force HTTP to HTTPS redirect
            $table->boolean('block_external_access')->default(false)->after('force_https'); // Block direct external access to backend ports
            $table->string('internal_bind_ip')->default('0.0.0.0')->after('block_external_access'); // IP to bind internal services (127.0.0.1 for localhost only)
            $table->json('security_headers')->nullable()->after('internal_bind_ip'); // Custom security headers (HSTS, CSP, etc.)
            $table->boolean('www_redirect')->default(false)->after('security_headers'); // Redirect www to non-www or vice versa
            $table->enum('www_redirect_type', ['www_to_non_www', 'non_www_to_www'])->nullable()->after('www_redirect');
        });
    }

    public function down()
    {
        Schema::table('domains', function (Blueprint $table) {
            $table->dropColumn([
                'force_https',
                'block_external_access', 
                'internal_bind_ip',
                'security_headers',
                'www_redirect',
                'www_redirect_type'
            ]);
        });
    }
};
