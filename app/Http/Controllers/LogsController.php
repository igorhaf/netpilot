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
            ],
            'statuses' => [
                'pending' => 'Pendente',
                'running' => 'Executando',
                'success' => 'Sucesso',
                'failed' => 'Falha',
            ],
        ]);
    }

    public function clear()
    {
        DeploymentLog::where('status', '!=', 'running')->delete();

        return back()->with('success', 'Logs limpos com sucesso!');
    }
}
