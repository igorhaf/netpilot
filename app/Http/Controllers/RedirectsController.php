<?php

namespace App\Http\Controllers;

use App\Models\Domain;
use App\Models\RedirectRule;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class RedirectsController extends Controller
{
    public function index(): Response
    {
        $redirects = RedirectRule::with('domain')
            ->orderBy('priority', 'asc')
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        return Inertia::render('Redirects/Index', [
            'redirects' => $redirects,
            'stats' => [
                'total' => RedirectRule::count(),
                'active' => RedirectRule::where('is_active', true)->count(),
                'inactive' => RedirectRule::where('is_active', false)->count(),
            ]
        ]);
    }

    public function create(): Response
    {
        $domains = Domain::where('is_active', true)->get();

        return Inertia::render('Redirects/Create', [
            'domains' => $domains,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'domain_id' => 'required|exists:domains,id',
            'source_pattern' => 'required|string|max:255',
            'target_url' => 'required|url|max:500',
            'redirect_type' => 'required|integer|in:301,302,307,308',
            'priority' => 'required|integer|min:1|max:1000',
            'is_active' => 'boolean',
            'preserve_query' => 'boolean',
            'conditions' => 'nullable|array',
        ]);

        $redirectRule = RedirectRule::create($validated);

        // Log creation
        \App\Models\DeploymentLog::create([
            'type' => 'redirect',
            'action' => 'create',
            'status' => 'success',
            'payload' => [
                'redirect_id' => $redirectRule->id,
                'domain_id' => $redirectRule->domain_id,
                'source_pattern' => $redirectRule->source_pattern,
                'target_url' => $redirectRule->target_url,
                'redirect_type' => $redirectRule->redirect_type,
                'priority' => $redirectRule->priority,
                'is_active' => $redirectRule->is_active,
            ],
            'started_at' => now(),
            'completed_at' => now(),
        ]);

        return redirect()->route('redirects.index')
            ->with('success', 'Regra de redirect criada com sucesso!');
    }

    public function edit(RedirectRule $redirect): Response
    {
        $domains = Domain::where('is_active', true)->get();

        return Inertia::render('Redirects/Edit', [
            'redirect' => $redirect->load('domain'),
            'domains' => $domains,
        ]);
    }

    public function update(Request $request, RedirectRule $redirect)
    {
        $validated = $request->validate([
            'domain_id' => 'required|exists:domains,id',
            'source_pattern' => 'required|string|max:255',
            'target_url' => 'required|url|max:500',
            'redirect_type' => 'required|integer|in:301,302,307,308',
            'priority' => 'required|integer|min:1|max:1000',
            'is_active' => 'boolean',
            'preserve_query' => 'boolean',
            'conditions' => 'nullable|array',
        ]);

        $redirect->update($validated);

        // Log update
        \App\Models\DeploymentLog::create([
            'type' => 'redirect',
            'action' => 'update',
            'status' => 'success',
            'payload' => [
                'redirect_id' => $redirect->id,
                'changes' => $validated,
            ],
            'started_at' => now(),
            'completed_at' => now(),
        ]);

        return redirect()->route('redirects.index')
            ->with('success', 'Regra de redirect atualizada com sucesso!');
    }

    public function destroy(RedirectRule $redirect)
    {
        $redirectId = $redirect->id;
        $redirect->delete();

        // Log deletion
        \App\Models\DeploymentLog::create([
            'type' => 'redirect',
            'action' => 'delete',
            'status' => 'success',
            'payload' => [
                'redirect_id' => $redirectId,
            ],
            'started_at' => now(),
            'completed_at' => now(),
        ]);

        return redirect()->route('redirects.index')
            ->with('success', 'Regra de redirect removida com sucesso!');
    }
}
