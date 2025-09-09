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

        $domain = Domain::create($data);

        // Log de criação de domínio
        \App\Models\DeploymentLog::create([
            'type' => 'domain',
            'action' => 'create',
            'status' => 'success',
            'payload' => [
                'domain_id' => $domain->id,
                'name' => $domain->name,
                'is_active' => $domain->is_active,
                'auto_ssl' => $domain->auto_ssl ?? false,
            ],
            'started_at' => now(),
            'completed_at' => now(),
        ]);

        // Create SSL certificate if auto_ssl is enabled
        if ($data["auto_ssl"] ?? false) {
            try {
                $sslCertificate = \App\Models\SslCertificate::create([
                    'domain_id' => $domain->id,
                    'domain_name' => $domain->name,
                    'status' => 'pending',
                    'auto_renew' => true,
                    'renewal_days_before' => 30,
                ]);

                $shouldRunSync = app()->environment('local', 'testing') || config('queue.default') === 'sync';
                if ($shouldRunSync) {
                    \App\Jobs\CreateSslCertificateJob::dispatchSync($sslCertificate->id);
                } else {
                    \App\Jobs\CreateSslCertificateJob::dispatch($sslCertificate->id);
                }

                return redirect()->route('domains.index')
                    ->with('success', 'Domínio criado com sucesso! Certificado SSL está sendo gerado...');
            } catch (\Exception $e) {
                return redirect()->route('domains.index')
                    ->with('warning', 'Domínio criado, mas houve erro ao solicitar SSL: ' . $e->getMessage());
            }
        }

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
        $validated = $request->validated();
        $domain->update($validated);

        // Log de atualização
        \App\Models\DeploymentLog::create([
            'type' => 'domain',
            'action' => 'update',
            'status' => 'success',
            'payload' => [
                'domain_id' => $domain->id,
                'changes' => $validated,
            ],
            'started_at' => now(),
            'completed_at' => now(),
        ]);

        return redirect()->route('domains.index')
            ->with('success', 'Domínio atualizado com sucesso!');
    }

    public function destroy(Domain $domain)
    {
        $domainId = $domain->id;
        $domainName = $domain->name;
        
        // Remover configuração dinâmica do Traefik
        try {
            app(\App\Services\TraefikService::class)->removeDomain($domain);
        } catch (\Exception $e) {
            \Log::warning("Erro ao remover configuração Traefik para {$domainName}: " . $e->getMessage());
        }

        // Revogar certificados SSL ativos
        foreach ($domain->sslCertificates()->where('status', 'valid')->get() as $certificate) {
            try {
                app(\App\Services\LetsEncryptService::class)->revokeCertificate($certificate);
            } catch (\Exception $e) {
                \Log::warning("Erro ao revogar certificado SSL para {$domainName}: " . $e->getMessage());
            }
        }

        $domain->delete();

        // Log de remoção
        \App\Models\DeploymentLog::create([
            'type' => 'domain',
            'action' => 'delete',
            'status' => 'success',
            'payload' => [
                'domain_id' => $domainId,
                'domain_name' => $domainName,
            ],
            'started_at' => now(),
            'completed_at' => now(),
        ]);

        return redirect()->route('domains.index')
            ->with('success', 'Domínio e SSL removidos com sucesso!');
    }
}
