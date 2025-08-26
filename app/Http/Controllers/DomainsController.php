<?php

namespace App\Http\Controllers;

use App\Models\Domain;
use App\Models\Upstream;
use App\Models\CertificateEvent;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Http\Requests\DomainRequest;

class DomainsController extends Controller
{
    public function index()
    {
        $domains = Domain::withCount('routeRules')
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        return Inertia::render('Domains/Index', [
            'domains' => $domains
        ]);
    }

    public function create()
    {
        return Inertia::render('Domains/Create');
    }

    public function store(DomainRequest $request)
    {
        Domain::create($request->validated());

        return redirect()->route('domains.index')
            ->with('success', 'Domain created successfully.');
    }

    public function edit(Domain $domain)
    {
        return Inertia::render('Domains/Edit', [
            'domain' => $domain
        ]);
    }

    public function update(DomainRequest $request, Domain $domain)
    {
        $domain->update($request->validated());

        return redirect()->route('domains.index')
            ->with('success', 'Domain updated successfully.');
    }

    public function destroy(Domain $domain)
    {
        $domain->delete();

        return redirect()->route('domains.index')
            ->with('success', 'Domain deleted successfully.');
    }
}
