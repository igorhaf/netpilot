<?php

namespace App\Http\Controllers;

use App\Models\RedirectRule;
use App\Http\Requests\RedirectRequest;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RedirectsController extends Controller
{
    public function index()
    {
        $redirects = RedirectRule::with('domain')
            ->orderBy('priority', 'desc')
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        return Inertia::render('Redirects/Index', [
            'redirects' => $redirects
        ]);
    }

    public function create()
    {
        $domains = \App\Models\Domain::where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('Redirects/Create', [
            'domains' => $domains
        ]);
    }

    public function store(RedirectRequest $request)
    {
        RedirectRule::create($request->validated());

        return redirect()->route('redirects.index')
            ->with('success', 'Redirect created successfully.');
    }

    public function edit(RedirectRule $redirect)
    {
        $domains = \App\Models\Domain::where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('Redirects/Edit', [
            'redirect' => $redirect->load('domain'),
            'domains' => $domains
        ]);
    }

    public function update(RedirectRequest $request, RedirectRule $redirect)
    {
        $redirect->update($request->validated());

        return redirect()->route('redirects.index')
            ->with('success', 'Redirect updated successfully.');
    }

    public function destroy(RedirectRule $redirect)
    {
        $redirect->delete();

        return redirect()->route('redirects.index')
            ->with('success', 'Redirect deleted successfully.');
    }
}
