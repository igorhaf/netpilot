<?php

namespace App\Http\Controllers;

use App\Models\Domain;
use App\Models\ProxyRule;
use App\Services\TraefikService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ProxyController extends Controller
{
    public function __construct(
        private TraefikService $traefikService
    ) {}

    public function index(Request $request): Response
    {
        $query = ProxyRule::with('domain');

        // Filtro de busca
        if ($request->filled('search')) {
            $search = $request->get('search');
            $query->where(function($q) use ($search) {
                $q->where('source_host', 'like', "%{$search}%")
                  ->orWhere('target_host', 'like', "%{$search}%")
                  ->orWhereHas('domain', function($domainQuery) use ($search) {
                      $domainQuery->where('name', 'like', "%{$search}%");
                  });
            });
        }

        // Filtro de status
        if ($request->filled('status')) {
            $status = $request->get('status') === '1';
            $query->where('is_active', $status);
        }

        $proxyRules = $query
            ->orderBy('priority', 'desc')
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        // Recalcular stats em tempo real
        $totalCount = ProxyRule::count();
        $activeCount = ProxyRule::where('is_active', true)->count();
        $inactiveCount = ProxyRule::where('is_active', false)->count();

        return Inertia::render('Proxy/Index', [
            'proxyRules' => $proxyRules,
            'stats' => [
                'total' => $totalCount,
                'active' => $activeCount,
                'inactive' => $inactiveCount,
            ],
            'filters' => [
                'search' => $request->get('search', ''),
                'status' => $request->get('status', ''),
            ],
            'timestamp' => now()->timestamp, // Força atualização no frontend
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

        // Garantir tenant_id obrigatório (sem default no banco)
        $domain = Domain::findOrFail($validated['domain_id']);
        $validated['tenant_id'] = $domain->tenant_id ?? 1;

        // Normalizar headers
        if (!isset($validated['headers'])) {
            $validated['headers'] = [];
        }

        $proxyRule = ProxyRule::create($validated);

        // 🚀 DEPLOY AUTOMÁTICO PARA TRAEFIK
        $deployResult = null;
        if ($proxyRule->is_active) {
            try {
                \Log::info("🚀 Deploy automático Traefik após criação de proxy", [
                    'proxy_id' => $proxyRule->id,
                    'source_host' => $proxyRule->source_host
                ]);
                
                $deployResult = $this->traefikService->applyConfiguration();
                
                \Log::info("✅ Deploy Traefik concluído", [
                    'success' => $deployResult['success'] ?? false,
                    'message' => $deployResult['message'] ?? 'N/A'
                ]);
                
            } catch (\Exception $e) {
                \Log::error("❌ Erro no deploy automático Traefik", [
                    'proxy_id' => $proxyRule->id,
                    'error' => $e->getMessage()
                ]);
                
                $deployResult = [
                    'success' => false,
                    'error' => $e->getMessage()
                ];
            }
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
                'traefik_deploy' => $deployResult,
            ],
            'started_at' => now(),
            'completed_at' => now(),
        ]);

        $message = 'Regra de proxy criada com sucesso!';
        if ($deployResult && $deployResult['success']) {
            $message .= ' Configuração Traefik aplicada automaticamente.';
        } elseif ($deployResult && !$deployResult['success']) {
            $message .= ' Configuração Traefik não foi aplicada automaticamente.';
        }

        return redirect()->route('proxy.index')
            ->with('success', $message);
    }

    public function edit($id): Response
    {
        // 🔧 SOLUÇÃO: Buscar o proxy manualmente em vez de usar Route Model Binding
        $proxyRule = ProxyRule::find($id);
        
        if (!$proxyRule) {
            return redirect()->route('proxy.index')
                ->with('error', 'Regra de proxy não encontrada!');
        }
        
        $domains = Domain::where('is_active', true)->get();

        return Inertia::render('Proxy/Edit', [
            'proxyRule' => $proxyRule->load('domain'),
            'domains' => $domains,
        ]);
    }

    public function update(Request $request, $id)
    {
        // 🔧 SOLUÇÃO: Buscar o proxy manualmente em vez de usar Route Model Binding
        $proxyRule = ProxyRule::find($id);
        
        if (!$proxyRule) {
            return redirect()->route('proxy.index')
                ->with('error', 'Regra de proxy não encontrada!');
        }
        
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

        // 🚀 DEPLOY AUTOMÁTICO PARA TRAEFIK
        $deployResult = null;
        try {
            \Log::info("🚀 Deploy automático Traefik após atualização de proxy", [
                'proxy_id' => $proxyRule->id,
                'source_host' => $proxyRule->source_host,
                'is_active' => $proxyRule->is_active
            ]);
            
            $deployResult = $this->traefikService->applyConfiguration();
            
            \Log::info("✅ Deploy Traefik concluído", [
                'success' => $deployResult['success'] ?? false,
                'message' => $deployResult['message'] ?? 'N/A'
            ]);
            
        } catch (\Exception $e) {
            \Log::error("❌ Erro no deploy automático Traefik", [
                'proxy_id' => $proxyRule->id,
                'error' => $e->getMessage()
            ]);
            
            $deployResult = [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }

        // Log update
        \App\Models\DeploymentLog::create([
            'type' => 'proxy_update',
            'action' => 'update_rule',
            'status' => 'success',
            'payload' => [
                'proxy_rule_id' => $proxyRule->id,
                'changes' => $validated,
                'traefik_deploy' => $deployResult,
            ],
            'started_at' => now(),
            'completed_at' => now(),
        ]);

        $message = 'Regra de proxy atualizada com sucesso!';
        if ($deployResult && $deployResult['success']) {
            $message .= ' Configuração Traefik aplicada automaticamente.';
        } elseif ($deployResult && !$deployResult['success']) {
            $message .= ' Configuração Traefik não foi aplicada automaticamente.';
        }

        return redirect()->route('proxy.index')
            ->with('success', $message);
    }

    public function destroy($id)
    {
        \Log::info("🔴 INÍCIO ProxyController::destroy", [
            'id_param' => $id,
            'method' => request()->method(),
            'url' => request()->fullUrl()
        ]);
        
        // 🔧 SOLUÇÃO: Buscar o proxy manualmente em vez de usar Route Model Binding
        $proxyRule = ProxyRule::find($id);
        
        if (!$proxyRule) {
            \Log::error("❌ Proxy com ID {$id} não encontrado!");
            return redirect()->route('proxy.index')
                ->with('error', 'Regra de proxy não encontrada!');
        }
        
        \Log::info("✅ Proxy encontrado", [
            'proxy_id' => $proxyRule->id,
            'source_host' => $proxyRule->source_host
        ]);
        
        $ruleId = $proxyRule->id;
        $sourceHost = $proxyRule->source_host;
        
        try {
            \Log::info("🔨 SOLUÇÃO DIRETA: Usando SQL direto para exclusão", ['proxy_id' => $ruleId]);
            
            // 🔧 SOLUÇÃO: Ignorar Eloquent completamente e usar SQL direto
            $deleted = \DB::table('proxy_rules')->where('id', $ruleId)->delete();
            
            \Log::info("🔨 SQL DELETE retornou", [
                'result' => $deleted,
                'proxy_id' => $ruleId
            ]);
            
            // Verificar se realmente foi deletado
            $stillExists = \DB::table('proxy_rules')->where('id', $ruleId)->first();
            if ($stillExists) {
                \Log::error("❌ ERRO CRÍTICO: Proxy ainda existe mesmo após SQL direto!", [
                    'proxy_id' => $ruleId,
                    'still_exists' => true
                ]);
                
                // Última tentativa: verificar se há algum problema de constraint
                \Log::info("🔍 Verificando se há problema de constraint...");
                $constraintCheck = \DB::select("PRAGMA foreign_key_check");
                \Log::info("Constraint check:", $constraintCheck);
                
            } else {
                \Log::info("✅ Proxy foi removido com sucesso via SQL direto!", ['proxy_id' => $ruleId]);
            }
            
            // Log de remoção
            \App\Models\DeploymentLog::create([
                'type' => 'proxy_update',
                'action' => 'delete_rule',
                'status' => $stillExists ? 'failed' : 'success',
                'payload' => [
                    'proxy_rule_id' => $ruleId,
                    'source_host' => $sourceHost,
                    'eloquent_delete_result' => $deleted,
                    'still_exists_after_delete' => $stillExists ? true : false,
                ],
                'started_at' => now(),
                'completed_at' => now(),
            ]);

            \Log::info("🔄 Retornando redirect para proxy.index");
            
            return redirect()->route('proxy.index')
                ->with('success', 'Regra de proxy removida com sucesso!');
                
        } catch (\Exception $e) {
            \Log::error("❌ ERRO na exclusão do proxy", [
                'proxy_id' => $ruleId,
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);
            
            throw $e;
        }
    }

    public function toggle(ProxyRule $proxyRule)
    {
        try {
            $proxyRule->update([
                'is_active' => !$proxyRule->is_active
            ]);

            // 🚀 DEPLOY AUTOMÁTICO TRAEFIK APÓS TOGGLE
            $deployResult = null;
            try {
                \Log::info("🚀 Deploy automático Traefik após toggle de proxy", [
                    'proxy_id' => $proxyRule->id,
                    'source_host' => $proxyRule->source_host,
                    'new_status' => $proxyRule->is_active
                ]);
                
                $deployResult = $this->traefikService->applyConfiguration();
                
                \Log::info("✅ Deploy Traefik concluído após toggle", [
                    'success' => $deployResult['success'] ?? false,
                    'message' => $deployResult['message'] ?? 'N/A'
                ]);
                
            } catch (\Exception $e) {
                \Log::error("❌ Erro no deploy automático Traefik após toggle", [
                    'proxy_id' => $proxyRule->id,
                    'error' => $e->getMessage()
                ]);
                
                $deployResult = [
                    'success' => false,
                    'error' => $e->getMessage()
                ];
            }

            $status = $proxyRule->is_active ? 'ativada' : 'desativada';

            return response()->json([
                'success' => true,
                'message' => "Regra de proxy {$status} com sucesso!",
                'is_active' => $proxyRule->is_active,
                'traefik_deploy' => $deployResult
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erro ao alterar status: ' . $e->getMessage()
            ], 500);
        }
    }

    public function deploy()
    {
        try {
            \Log::info("🚀 Deploy manual Traefik solicitado");
            
            $result = $this->traefikService->applyConfiguration();
            
            if ($result['success']) {
                \Log::info("✅ Deploy manual Traefik concluído com sucesso", [
                    'message' => $result['message']
                ]);
                
                return back()->with('success', 'Configuração do Traefik aplicada com sucesso! ' . $result['message']);
            } else {
                \Log::error("❌ Deploy manual Traefik falhou", [
                    'error' => $result['error'] ?? 'Erro desconhecido'
                ]);
                
                return back()->with('error', 'Erro ao aplicar configuração Traefik: ' . ($result['error'] ?? 'Erro desconhecido'));
            }
            
        } catch (\Exception $e) {
            \Log::error("❌ Exceção no deploy manual Traefik", [
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);
            
            return back()->with('error', 'Erro ao gerar configuração: ' . $e->getMessage());
        }
    }
}
