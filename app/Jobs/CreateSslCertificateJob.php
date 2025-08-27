<?php

namespace App\Jobs;

use App\Models\SslCertificate;
use App\Services\LetsEncryptService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use App\Models\DeploymentLog;

class CreateSslCertificateJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        private SslCertificate $certificate
    ) {}

    public function handle(): void
    {
        $jobLog = null;
        try {
            Log::info("Iniciando criação de certificado SSL para {$this->certificate->domain_name}");

            // Log principal do job
            $jobLog = DeploymentLog::create([
                'type' => 'ssl_renewal',
                'action' => 'job_start',
                'status' => 'running',
                'payload' => [
                    'certificate_id' => $this->certificate->id,
                    'domain_name' => $this->certificate->domain_name,
                ],
                'started_at' => now(),
            ]);

            $this->certificate->update(['status' => 'processing']);

            $letsEncryptService = app(LetsEncryptService::class);
            $result = $letsEncryptService->issueCertificate($this->certificate);

            if ($result['success']) {
                Log::info("Certificado SSL criado com sucesso para {$this->certificate->domain_name}");

                // Marcar log do job como sucesso
                if ($jobLog) {
                    $output = 'Emissão concluída com sucesso';
                    if (!empty($result['verification'])) {
                        $output .= "\n" . json_encode($result['verification']);
                    }
                    $jobLog->markAsSuccess($output);
                }

                // Broadcast event for real-time updates
                broadcast(new \App\Events\SslCertificateUpdated($this->certificate->fresh()));
            }
        } catch (\Exception $e) {
            Log::error("Erro ao criar certificado SSL para {$this->certificate->domain_name}: " . $e->getMessage());

            $this->certificate->update([
                'status' => 'failed',
                'last_error' => $e->getMessage()
            ]);

            if ($jobLog) {
                $jobLog->markAsFailed($e->getMessage());
            } else {
                // Garante visibilidade mesmo se falhar antes de criar $jobLog
                DeploymentLog::create([
                    'type' => 'ssl_renewal',
                    'action' => 'job_error',
                    'status' => 'failed',
                    'payload' => [
                        'certificate_id' => $this->certificate->id,
                        'domain_name' => $this->certificate->domain_name,
                    ],
                    'error' => $e->getMessage(),
                    'started_at' => now(),
                    'completed_at' => now(),
                ]);
            }

            // Broadcast error event
            broadcast(new \App\Events\SslCertificateUpdated($this->certificate->fresh()));

            throw $e;
        }
    }

    public function failed(\Throwable $exception): void
    {
        Log::error("Job falhou para certificado SSL {$this->certificate->domain_name}: " . $exception->getMessage());

        $this->certificate->update([
            'status' => 'failed',
            'last_error' => $exception->getMessage()
        ]);

        DeploymentLog::create([
            'type' => 'ssl_renewal',
            'action' => 'job_failed',
            'status' => 'failed',
            'payload' => [
                'certificate_id' => $this->certificate->id,
                'domain_name' => $this->certificate->domain_name,
            ],
            'error' => $exception->getMessage(),
            'started_at' => now(),
            'completed_at' => now(),
        ]);

        broadcast(new \App\Events\SslCertificateUpdated($this->certificate->fresh()));
    }
}
