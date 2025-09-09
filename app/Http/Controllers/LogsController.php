<?php

namespace App\Http\Controllers;

use App\Models\DeploymentLog;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LogsController extends Controller
{
    public function index(Request $request): Response
    {
        $query = DeploymentLog::query();

        // Filtros
        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('action', 'like', '%' . $request->search . '%')
                    ->orWhere('output', 'like', '%' . $request->search . '%')
                    ->orWhere('error', 'like', '%' . $request->search . '%');
            });
        }

        $logs = $query->orderBy('created_at', 'desc')
            ->paginate(20);

        return Inertia::render('Logs/Index', [
            'logs' => $logs,
            'filters' => $request->only(['type', 'status', 'search']),
            'stats' => [
                'total' => DeploymentLog::count(),
                'success' => DeploymentLog::where('status', 'success')->count(),
                'failed' => DeploymentLog::where('status', 'failed')->count(),
                'running' => DeploymentLog::where('status', 'running')->count(),
            ],
            'types' => [
                'nginx' => 'Nginx',
                'traefik' => 'Traefik',
                'ssl_renewal' => 'SSL Renewal',
                'proxy_update' => 'Proxy Update',
                'domain' => 'Domínio',
                'redirect' => 'Redirect',
            ],
            'statuses' => [
                'pending' => 'Pendente',
                'running' => 'Executando',
                'success' => 'Sucesso',
                'failed' => 'Falha',
            ],
        ]);
    }

    public function clear(Request $request)
    {
        try {
            $forceAll = $request->boolean('force_all', false);
            
            if ($forceAll) {
                // Limpar TODOS os logs quando force_all=true
                $totalDeleted = DeploymentLog::count();
                DeploymentLog::truncate();
                $message = "Todos os logs foram limpos! {$totalDeleted} registros removidos.";
            } else {
                // Limpar logs concluídos (success, failed, pending)
                $completedCount = DeploymentLog::whereIn('status', ['success', 'failed', 'pending'])->delete();
                
                // Limpar logs "running" que estão há mais de 5 minutos (provavelmente travados)
                $stuckCount = DeploymentLog::where('status', 'running')
                    ->where(function($q) {
                        $q->where('started_at', '<', now()->subMinutes(5))
                          ->orWhereNull('started_at');
                    })
                    ->delete();
                
                $totalDeleted = $completedCount + $stuckCount;
                $message = "Logs limpos com sucesso! {$totalDeleted} registros removidos ({$completedCount} concluídos, {$stuckCount} travados).";
            }
            
            return response()->json([
                'success' => true,
                'message' => $message,
                'total_deleted' => $totalDeleted
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erro ao limpar logs: ' . $e->getMessage()
            ], 500);
        }
    }
}
