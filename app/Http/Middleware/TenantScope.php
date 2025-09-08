<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class TenantScope
{
    public function handle(Request $request, Closure $next)
    {
        if ($request->user()) {
            // Apply tenant scope to all relevant models
            $tenantId = $request->user()->current_tenant_id;
            
            if ($tenantId) {
                // Models that should be scoped to tenant
                $models = [
                    'App\Models\Domain',
                    'App\Models\ProxyRule',
                    'App\Models\Upstream',
                    'App\Models\SslCertificate',
                    'App\Models\DeploymentLog'
                ];
                
                foreach ($models as $model) {
                    $model::addGlobalScope('tenant', function ($builder) use ($tenantId) {
                        $builder->where('tenant_id', $tenantId);
                    });
                }
            }
        }

        return $next($request);
    }
}
