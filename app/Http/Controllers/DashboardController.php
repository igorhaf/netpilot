<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Models\Domain;
use App\Models\ProxyRule;
use App\Models\SslCertificate;
use App\Models\DeploymentLog;
use App\Models\RedirectRule;

class DashboardController extends Controller
{
    public function index()
    {
        // Estatísticas gerais
        $domainsTotal = Domain::count();
        $domainsActive = Domain::where('is_active', true)->count();

        $proxyRulesTotal = ProxyRule::count();
        $proxyRulesActive = ProxyRule::where('is_active', true)->count();

        $sslTotal = SslCertificate::count();
        $sslValid = SslCertificate::where('status', 'valid')->count();
        $sslExpiring = SslCertificate::where('status', 'expiring')->count();
        $sslExpired = SslCertificate::where('status', 'expired')->count();

        $redirectsTotal = RedirectRule::count();
        $redirectsActive = RedirectRule::where('is_active', true)->count();

        // Logs recentes
        $recentLogs = DeploymentLog::with([])
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($log) {
                return [
                    'id' => $log->id,
                    'type' => $log->type,
                    'action' => $log->action,
                    'status' => $log->status,
                    'created_at' => $log->created_at,
                    'duration' => $log->started_at && $log->completed_at
                        ? $log->started_at->diffInSeconds($log->completed_at)
                        : null,
                ];
            });

        // Certificados próximos do vencimento
        $expiringCertificates = SslCertificate::with('domain')
            ->whereIn('status', ['valid', 'expiring'])
            ->whereNotNull('expires_at')
            ->orderBy('expires_at', 'asc')
            ->limit(5)
            ->get()
            ->map(function ($cert) {
                $daysUntilExpiry = now()->diffInDays($cert->expires_at, false);
                return [
                    'id' => $cert->id,
                    'domain_name' => $cert->domain_name,
                    'expires_at' => $cert->expires_at,
                    'days_until_expiry' => $daysUntilExpiry,
                    'status' => $cert->status,
                ];
            });

        // Status do sistema
        $systemStatus = [
            'nginx' => [
                'status' => 'operational', // Implementar verificação real
                'uptime' => '99.9%',
                'last_deploy' => DeploymentLog::where('type', 'nginx')
                    ->where('status', 'success')
                    ->latest()
                    ->first()?->created_at,
            ],
            'traefik' => [
                'status' => 'operational',
                'uptime' => '99.8%',
                'last_deploy' => DeploymentLog::where('type', 'traefik')
                    ->where('status', 'success')
                    ->latest()
                    ->first()?->created_at,
            ]
        ];

        return Inertia::render('Dashboard', [
            'stats' => [
                'domains' => [
                    'total' => $domainsTotal,
                    'active' => $domainsActive,
                    'inactive' => $domainsTotal - $domainsActive,
                ],
                'proxy_rules' => [
                    'total' => $proxyRulesTotal,
                    'active' => $proxyRulesActive,
                    'inactive' => $proxyRulesTotal - $proxyRulesActive,
                ],
                'ssl_certificates' => [
                    'total' => $sslTotal,
                    'valid' => $sslValid,
                    'expiring' => $sslExpiring,
                    'expired' => $sslExpired,
                ],
                'redirects' => [
                    'total' => $redirectsTotal,
                    'active' => $redirectsActive,
                    'inactive' => $redirectsTotal - $redirectsActive,
                ],
            ],
            'recentLogs' => $recentLogs,
            'expiringCertificates' => $expiringCertificates,
            'systemStatus' => $systemStatus,
        ]);
    }

    public function __invoke()
    {
        return $this->index();
    }
}
