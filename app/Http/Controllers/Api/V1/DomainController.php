<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\V1\DomainResource;
use App\Models\Domain;
use Illuminate\Http\Request;

class DomainController extends Controller
{
    public function index()
    {
        return DomainResource::collection(
            Domain::with('tenant')->get()
        );
    }

    public function show(Domain $domain)
    {
        return new DomainResource($domain);
    }
}
