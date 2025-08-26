<?php

namespace App\Http\Controllers;

use App\Models\Upstream;
use App\Http\Requests\UpstreamRequest;
use Illuminate\Http\Request;
use Inertia\Inertia;

class UpstreamsController extends Controller
{
    public function index()
    {
        $upstreams = Upstream::with('domain')
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        return Inertia::render('Upstreams/Index', [
            'upstreams' => $upstreams
        ]);
    }

    public function create()
    {
        $domains = \App\Models\Domain::where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('Upstreams/Create', [
            'domains' => $domains
        ]);
    }

    public function store(UpstreamRequest $request)
    {
        Upstream::create($request->validated());

        return redirect()->route('upstreams.index')
            ->with('success', 'Upstream created successfully.');
    }

    public function edit(Upstream $upstream)
    {
        $domains = \App\Models\Domain::where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('Upstreams/Edit', [
            'upstream' => $upstream->load('domain'),
            'domains' => $domains
        ]);
    }

    public function update(UpstreamRequest $request, Upstream $upstream)
    {
        $upstream->update($request->validated());

        return redirect()->route('upstreams.index')
            ->with('success', 'Upstream updated successfully.');
    }

    public function destroy(Upstream $upstream)
    {
        $upstream->delete();

        return redirect()->route('upstreams.index')
            ->with('success', 'Upstream deleted successfully.');
    }
}
