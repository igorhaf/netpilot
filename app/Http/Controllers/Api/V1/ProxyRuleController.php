<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\V1\ProxyRuleResource;
use App\Models\ProxyRule;
use Illuminate\Http\Request;

class ProxyRuleController extends Controller
{
    public function index()
    {
        return ProxyRuleResource::collection(
            ProxyRule::with(['tenant', 'domain'])->get()
        );
    }

    public function show(ProxyRule $proxyRule)
    {
        return new ProxyRuleResource($proxyRule);
    }
}
