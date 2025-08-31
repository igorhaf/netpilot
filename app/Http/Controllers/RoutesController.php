<?php

namespace App\Http\Controllers;

use App\Http\Requests\RouteRequest;
use App\Infra\Traefik\TraefikProvider;
use App\Models\Domain;
use App\Models\RouteRule;
use App\Models\Upstream;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class RoutesController extends Controller
{
    public function index(Request $request): Response
    {
        $routes = RouteRule::query()
            ->with(['domain', 'upstream'])
            ->orderBy('created_at', 'desc')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Routes/Index', [
            'routes' => $routes,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Routes/Create', [
            'domains' => Domain::query()->orderBy('name')->get(['id','name']),
            'upstreams' => Upstream::query()->orderBy('name')->get(['id','name']),
        ]);
    }

    public function store(RouteRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $route = RouteRule::create($validated);

        try {
            TraefikProvider::make()->syncAll();
        } catch (\Throwable $e) {
            return redirect()->route('routes.index')
                ->with('error', 'Route created but sync failed: ' . $e->getMessage());
        }

        return redirect()->route('routes.index')->with('success', 'Route created.');
    }

    public function edit(int $id): Response
    {
        $route = RouteRule::with(['domain','upstream'])->findOrFail($id);
        return Inertia::render('Routes/Edit', [
            'route' => $route,
            'domains' => Domain::query()->orderBy('name')->get(['id','name']),
            'upstreams' => Upstream::query()->orderBy('name')->get(['id','name']),
        ]);
    }

    public function update(RouteRequest $request, int $id): RedirectResponse
    {
        $route = RouteRule::findOrFail($id);
        $route->update($request->validated());

        try {
            TraefikProvider::make()->syncAll();
        } catch (\Throwable $e) {
            return redirect()->route('routes.index')
                ->with('error', 'Route updated but sync failed: ' . $e->getMessage());
        }

        return redirect()->route('routes.index')->with('success', 'Route updated.');
    }

    public function destroy(int $id): RedirectResponse
    {
        $route = RouteRule::findOrFail($id);
        $route->delete();

        try {
            TraefikProvider::make()->syncAll();
        } catch (\Throwable $e) {
            return redirect()->route('routes.index')
                ->with('error', 'Route deleted but sync failed: ' . $e->getMessage());
        }

        return redirect()->route('routes.index')->with('success', 'Route deleted.');
    }
}
