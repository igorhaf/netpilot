<?php

namespace App\Http\Controllers;

use App\Models\Tenant;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TenantController extends Controller
{
    public function index()
    {
        return Inertia::render('Tenants/Index', [
            'tenants' => Tenant::all()
        ]);
    }

    public function create()
    {
        return Inertia::render('Tenants/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:tenants',
            'is_active' => 'boolean'
        ]);

        Tenant::create($validated);

        return redirect()->route('tenants.index')->with('success', 'Tenant created successfully');
    }

    public function show(Tenant $tenant)
    {
        return Inertia::render('Tenants/Show', [
            'tenant' => $tenant->load(['domains', 'proxyRules', 'upstreams', 'sslCertificates'])
        ]);
    }

    public function edit(Tenant $tenant)
    {
        return Inertia::render('Tenants/Edit', [
            'tenant' => $tenant
        ]);
    }

    public function update(Request $request, Tenant $tenant)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:tenants,slug,'.$tenant->id,
            'is_active' => 'boolean'
        ]);

        $tenant->update($validated);

        return redirect()->route('tenants.index')->with('success', 'Tenant updated successfully');
    }

    public function destroy(Tenant $tenant)
    {
        $tenant->delete();

        return redirect()->route('tenants.index')->with('success', 'Tenant deleted successfully');
    }

    public function switch(Tenant $tenant)
    {
        auth()->user()->update(['current_tenant_id' => $tenant->id]);
        
        return redirect()->back()->with('success', 'Tenant switched successfully');
    }
}
