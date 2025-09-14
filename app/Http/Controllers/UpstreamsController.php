<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpstreamRequest;
use App\Infra\Traefik\TraefikProvider;
use App\Models\Domain;
use App\Models\Upstream;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class UpstreamsController extends Controller
{
    public function index(Request $request): Response
    {
        $upstreams = Upstream::query()
            ->with('domain')
            ->orderBy('created_at', 'desc')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Upstreams/Index', [
            'upstreams' => $upstreams,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Upstreams/Create', [
            'domains' => Domain::query()->orderBy('name')->get(['id','name']),
        ]);
    }

    public function store(UpstreamRequest $request)
    {
        $validated = $request->validated();
        $upstream = Upstream::create($validated);

        // Sync Traefik files
        try {
            TraefikProvider::make()->syncAll();
        } catch (\Throwable $e) {
            if ($request->expectsJson()) {
                return response()->json(['error' => 'Upstream created but sync failed: ' . $e->getMessage()], 500);
            }
            // swallow errors but flash message
            return redirect()->route('upstreams.index')
                ->with('error', 'Upstream created but sync failed: ' . $e->getMessage());
        }

        if ($request->expectsJson()) {
            return response()->json($upstream, 201);
        }

        return redirect()->route('upstreams.index')->with('success', 'Upstream created.');
    }

    public function edit(int $id): Response
    {
        $upstream = Upstream::with('domain')->findOrFail($id);
        return Inertia::render('Upstreams/Edit', [
            'upstream' => $upstream,
            'domains' => Domain::query()->orderBy('name')->get(['id','name']),
        ]);
    }

    public function update(UpstreamRequest $request, int $id): RedirectResponse
    {
        $upstream = Upstream::findOrFail($id);
        $upstream->update($request->validated());

        try {
            TraefikProvider::make()->syncAll();
        } catch (\Throwable $e) {
            return redirect()->route('upstreams.index')
                ->with('error', 'Upstream updated but sync failed: ' . $e->getMessage());
        }

        return redirect()->route('upstreams.index')->with('success', 'Upstream updated.');
    }

    public function destroy(int $id): RedirectResponse
    {
        $upstream = Upstream::findOrFail($id);
        $upstream->delete();

        try {
            TraefikProvider::make()->syncAll();
        } catch (\Throwable $e) {
            return redirect()->route('upstreams.index')
                ->with('error', 'Upstream deleted but sync failed: ' . $e->getMessage());
        }

        return redirect()->route('upstreams.index')->with('success', 'Upstream deleted.');
    }
}
