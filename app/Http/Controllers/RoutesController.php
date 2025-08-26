<?php

namespace App\Http\Controllers;

use App\Models\RouteRule;
use App\Http\Requests\RouteRequest;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RoutesController extends Controller
{
    public function index()
    {
        $routes = RouteRule::with(['domain', 'upstream'])
            ->orderBy('priority', 'desc')
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        return Inertia::render('Routes/Index', [
            'routes' => $routes
        ]);
    }

    public function create()
    {
        $domains = \App\Models\Domain::where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name']);

        $upstreams = \App\Models\Upstream::with('domain')
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'domain_id']);

        return Inertia::render('Routes/Create', [
            'domains' => $domains,
            'upstreams' => $upstreams
        ]);
    }

    public function store(RouteRequest $request)
    {
        RouteRule::create($request->validated());

        return redirect()->route('routes.index')
            ->with('success', 'Route created successfully.');
    }

    public function edit(RouteRule $route)
    {
        $domains = \App\Models\Domain::where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name']);

        $upstreams = \App\Models\Upstream::with('domain')
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'domain_id']);

        return Inertia::render('Routes/Edit', [
            'route' => $route->load(['domain', 'upstream']),
            'domains' => $domains,
            'upstreams' => $upstreams
        ]);
    }

    public function update(RouteRequest $request, RouteRule $route)
    {
        $route->update($request->validated());

        return redirect()->route('routes.index')
            ->with('success', 'Route updated successfully.');
    }

    public function destroy(RouteRule $route)
    {
        $route->delete();

        return redirect()->route('routes.index')
            ->with('success', 'Route deleted successfully.');
    }
}
