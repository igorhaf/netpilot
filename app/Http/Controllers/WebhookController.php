<?php

namespace App\Http\Controllers;

use App\Models\Webhook;
use Illuminate\Http\Request;
use Inertia\Inertia;

class WebhookController extends Controller
{
    public function index()
    {
        return Inertia::render('Webhooks/Index', [
            'webhooks' => Webhook::with('tenant')->get()
        ]);
    }

    public function create()
    {
        return Inertia::render('Webhooks/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'tenant_id' => 'required|exists:tenants,id',
            'name' => 'required|string|max:255',
            'url' => 'required|url',
            'secret' => 'nullable|string',
            'events' => 'required|array',
            'is_active' => 'boolean'
        ]);

        Webhook::create($validated);

        return redirect()->route('webhooks.index')->with('success', 'Webhook created successfully');
    }

    public function show(Webhook $webhook)
    {
        return Inertia::render('Webhooks/Show', [
            'webhook' => $webhook->load(['tenant', 'events'])
        ]);
    }

    public function edit(Webhook $webhook)
    {
        return Inertia::render('Webhooks/Edit', [
            'webhook' => $webhook
        ]);
    }

    public function update(Request $request, Webhook $webhook)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'url' => 'required|url',
            'secret' => 'nullable|string',
            'events' => 'required|array',
            'is_active' => 'boolean'
        ]);

        $webhook->update($validated);

        return redirect()->route('webhooks.index')->with('success', 'Webhook updated successfully');
    }

    public function destroy(Webhook $webhook)
    {
        $webhook->delete();

        return redirect()->route('webhooks.index')->with('success', 'Webhook deleted successfully');
    }
}
