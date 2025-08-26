<?php

namespace App\Http\Controllers;

use App\Models\Domain;
use App\Models\SslCertificate;
use App\Services\TraefikService;
use App\Services\LetsEncryptService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SslController extends Controller
{
    public function __construct(
        private TraefikService $traefikService,
        private LetsEncryptService $letsEncryptService
    ) {}

    public function index(): Response
    {
        $certificates = SslCertificate::with('domain')
            ->orderBy('expires_at', 'asc')
            ->paginate(15);

        // Update certificate statuses
        $certificates->getCollection()->each(function ($cert) {
            $cert->updateStatus();
        });

        return Inertia::render('SSL/Index', [
            'certificates' => $certificates,
            'stats' => [
                'total' => SslCertificate::count(),
                'valid' => SslCertificate::where('status', 'valid')->count(),
                'expiring' => SslCertificate::where('status', 'expiring')->count(),
                'expired' => SslCertificate::where('status', 'expired')->count(),
            ]
        ]);
    }

    public function create(): Response
    {
        $domains = Domain::where('is_active', true)
            ->whereDoesntHave('sslCertificates', function ($query) {
                $query->whereIn('status', ['valid', 'pending']);
            })
            ->get();

        return Inertia::render('SSL/Create', [
            'domains' => $domains,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'domain_id' => 'required|exists:domains,id',
            'domain_name' => 'required|string|max:255',
            'san_domains' => 'nullable|array',
            'san_domains.*' => 'string|max:255',
            'auto_renew' => 'boolean',
            'renewal_days_before' => 'required|integer|min:1|max:90',
        ]);

        $certificate = SslCertificate::create($validated);

        // Issue certificate via Let's Encrypt
        try {
            $this->letsEncryptService->issueCertificate($certificate);

            return redirect()->route('ssl.index')
                ->with('success', 'Certificado SSL solicitado com sucesso!');
        } catch (\Exception $e) {
            $certificate->update([
                'status' => 'failed',
                'last_error' => $e->getMessage()
            ]);

            return redirect()->route('ssl.index')
                ->with('error', 'Erro ao solicitar certificado: ' . $e->getMessage());
        }
    }

    public function show(SslCertificate $certificate): Response
    {
        $certificate->updateStatus();

        return Inertia::render('SSL/Show', [
            'certificate' => $certificate->load('domain'),
        ]);
    }

    public function renew(SslCertificate $certificate)
    {
        try {
            $this->letsEncryptService->renewCertificate($certificate);

            return back()->with('success', 'Certificado renovado com sucesso!');
        } catch (\Exception $e) {
            return back()->with('error', 'Erro ao renovar certificado: ' . $e->getMessage());
        }
    }

    public function renewAll()
    {
        $certificates = SslCertificate::where('auto_renew', true)
            ->where('status', 'expiring')
            ->get();

        $renewed = 0;
        $errors = [];

        foreach ($certificates as $certificate) {
            try {
                $this->letsEncryptService->renewCertificate($certificate);
                $renewed++;
            } catch (\Exception $e) {
                $errors[] = $certificate->domain_name . ': ' . $e->getMessage();
            }
        }

        if ($renewed > 0) {
            $message = "Renovados {$renewed} certificados com sucesso!";
            if (!empty($errors)) {
                $message .= ' Erros: ' . implode(', ', $errors);
            }
            return back()->with('success', $message);
        } else {
            return back()->with('error', 'Nenhum certificado foi renovado. Erros: ' . implode(', ', $errors));
        }
    }

    public function toggle(SslCertificate $certificate)
    {
        $certificate->update([
            'auto_renew' => !$certificate->auto_renew
        ]);

        $status = $certificate->auto_renew ? 'habilitada' : 'desabilitada';

        return back()->with('success', "Auto renovação {$status} com sucesso!");
    }

    public function destroy(SslCertificate $certificate)
    {
        // Revoke certificate if valid
        if ($certificate->status === 'valid') {
            try {
                $this->letsEncryptService->revokeCertificate($certificate);
            } catch (\Exception $e) {
                // Log error but continue with deletion
                logger()->error('Failed to revoke certificate: ' . $e->getMessage());
            }
        }

        $certificate->delete();

        return redirect()->route('ssl.index')
            ->with('success', 'Certificado SSL removido com sucesso!');
    }

    public function deploy()
    {
        try {
            $result = $this->traefikService->deployConfiguration();

            return back()->with('success', 'Configuração do Traefik atualizada com sucesso!');
        } catch (\Exception $e) {
            return back()->with('error', 'Erro ao atualizar configuração: ' . $e->getMessage());
        }
    }
}
