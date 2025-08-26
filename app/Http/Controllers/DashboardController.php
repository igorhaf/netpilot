<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Models\Domain;
use App\Models\Upstream;
use App\Models\RouteRule;
use App\Models\RedirectRule;

class DashboardController extends Controller
{
    public function index()
    {
        return Inertia::render('Dashboard', [
            'stats' => [
                'domains' => Domain::count(),
                'upstreams' => Upstream::count(),
                'routes' => RouteRule::count(),
                'redirects' => RedirectRule::count(),
            ],
            'recentEvents' => class_exists(\App\Models\CertificateEvent::class) 
                ? \App\Models\CertificateEvent::latest()->limit(5)->get() 
                : []
        ]);
    }

    public function __invoke()
    {
        return $this->index();
    }
}
