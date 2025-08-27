<?php

namespace App\Http\Controllers;

use App\Models\Domain;
use App\Models\ProxyRule;
use App\Services\NginxService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProxyController extends Controller
{
    public function __construct(
        private NginxService $nginxService
    ) {}

    public function index(): Response
    {
        $proxyRules = ProxyRule::with('domain')
            ->orderBy('priority', 'desc')
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        return Inertia::render('Proxy/Index', [
            'proxyRules' => $proxyRules,
            'stats' => [
                'total' => ProxyRule::count(),
                'active' => ProxyRule::where('is_active', true)->count(),
                'inactive' => ProxyRule::where('is_active', false)->count(),
            ]
        ]);
    }

    public function create(): Response
    {
        $domains = Domain::where('is_active', true)->get();

        return Inertia::render('Proxy/Create', [
            'domains' => $domains,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'domain_id' => 'required|exists:domains,id',
            'source_host' => 'required|string|max:255',
            'source_port' => 'required|string|max:10',
            'target_host' => 'required|string|max:255',
            'target_port' => 'required|string|max:10',
            'protocol' => 'required|in:http,https',
            'headers' => 'nullable|array',
            'priority' => 'required|integer|min:1|max:1000',
            'is_active' => 'boolean',
        ]);

        $proxyRule = ProxyRule::create($validated);

        // Generate nginx config
        $proxyRule->update([
            'nginx_config' => $proxyRule->generateNginxConfig()
        ]);

        // Deploy to nginx if active
        if ($proxyRule->is_active) {
            $this->nginxService->deployConfiguration();
        }

        // Log creation
        \App\Models\DeploymentLog::create([
            'type' => 'proxy_update',
            'action' => 'create_rule',
            'status' => 'success',
            'payload' => [
                'proxy_rule_id' => $proxyRule->id,
                'domain_id' => $proxyRule->domain_id,
                'source' => [$proxyRule->source_host, $proxyRule->source_port],
                'target' => [$proxyRule->target_host, $proxyRule->target_port],
                'protocol' => $proxyRule->protocol,
                'priority' => $proxyRule->priority,
                'is_active' => $proxyRule->is_active,
            ],
            'started_at' => now(),
            'completed_at' => now(),
        ]);

        return redirect()->route('proxy.index')
            ->with('success', 'Regra de proxy criada com sucesso!');
    }

    public function edit(ProxyRule $proxyRule): Response
    {
        $domains = Domain::where('is_active', true)->get();

        return Inertia::render('Proxy/Edit', [
            'proxyRule' => $proxyRule->load('domain'),
            'domains' => $domains,
        ]);
    }

    public function update(Request $request, ProxyRule $proxyRule)
    {
        $validated = $request->validate([
            'domain_id' => 'required|exists:domains,id',
            'source_host' => 'required|string|max:255',
            'source_port' => 'required|string|max:10',
            'target_host' => 'required|string|max:255',
            'target_port' => 'required|string|max:10',
            'protocol' => 'required|in:http,https',
            'headers' => 'nullable|array',
            'priority' => 'required|integer|min:1|max:1000',
            'is_active' => 'boolean',
        ]);

        $proxyRule->update($validated);

        // Regenerate nginx config
        $proxyRule->update([
            'nginx_config' => $proxyRule->generateNginxConfig()
        ]);

        // Deploy to nginx
        $this->nginxService->deployConfiguration();

        // Log update
        \App\Models\DeploymentLog::create([
            'type' => 'proxy_update',
            'action' => 'update_rule',
            'status' => 'success',
            'payload' => [
                'proxy_rule_id' => $proxyRule->id,
                'changes' => $validated,
            ],
            'started_at' => now(),
            'completed_at' => now(),
        ]);

        return redirect()->route('proxy.index')
            ->with('success', 'Regra de proxy atualizada com sucesso!');
    }

    public function destroy(ProxyRule $proxyRule)
    {
        $proxyRule->delete();

        // Redeploy nginx without this rule
        $this->nginxService->deployConfiguration();

        // Log deletion
        \App\Models\DeploymentLog::create([
            'type' => 'proxy_update',
            'action' => 'delete_rule',
            'status' => 'success',
            'payload' => [
                'proxy_rule_id' => $proxyRule->id,
            ],
            'started_at' => now(),
            'completed_at' => now(),
        ]);

        return redirect()->route('proxy.index')
            ->with('success', 'Regra de proxy removida com sucesso!');
    }

    public function toggle(ProxyRule $proxyRule)
    {
        $proxyRule->update([
            'is_active' => !$proxyRule->is_active
        ]);

        $this->nginxService->deployConfiguration();

        $status = $proxyRule->is_active ? 'ativada' : 'desativada';

        return back()->with('success', "Regra de proxy {$status} com sucesso!");
    }

    public function deploy()
    {
        try {
            $result = $this->nginxService->deployConfiguration();

            return back()->with('success', 'Configuração do Nginx atualizada com sucesso!');
        } catch (\Exception $e) {
            return back()->with('error', 'Erro ao atualizar configuração: ' . $e->getMessage());
        }
    }
}
