<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\V1\TenantResource;
use App\Models\Tenant;
use Illuminate\Http\Request;

class TenantController extends Controller
{
    public function index()
    {
        return TenantResource::collection(
            Tenant::where('is_active', true)->get()
        );
    }

    public function show(Tenant $tenant)
    {
        return new TenantResource($tenant);
    }
}
