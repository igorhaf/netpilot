<?php

namespace App\Http\Controllers;

use App\Models\Domain;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Http\Requests\DomainRequest;

class DomainsController extends Controller
{
    public function index()
    {
        $domains = Domain::withCount(['proxyRules', 'sslCertificates', 'redirectRules'])
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
        $data = $request->validated();
        
        // Handle DNS records
        if (isset($data['dns_records']) && is_array($data['dns_records'])) {
            $data['dns_records'] = $data['dns_records'];
        }

        Domain::create($data);

        return redirect()->route('domains.index')
            ->with('success', 'Domínio criado com sucesso!');
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
            ->with('success', 'Domínio atualizado com sucesso!');
    }

    public function destroy(Domain $domain)
    {
        $domain->delete();

        return redirect()->route('domains.index')
            ->with('success', 'Domínio removido com sucesso!');
    }
}
