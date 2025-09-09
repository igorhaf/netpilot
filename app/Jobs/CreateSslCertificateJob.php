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

    // Use untyped/null-default for backward compatibility with old queued payloads
    private $certificateId = null;
    // Legacy property name kept to allow unserialization of old jobs which stored the model
    public $certificate; // may be an instance or a ModelIdentifier restored by SerializesModels

    public function __construct(
        int $certificateId
    ) {
        $this->certificateId = $certificateId;
    }

    public function handle(): void
    {
        $jobLog = null;
        // Backward-compat: if certificateId is null, try to derive from legacy $certificate
        if (empty($this->certificateId) && isset($this->certificate)) {
            if ($this->certificate instanceof SslCertificate) {
                $this->certificateId = $this->certificate->getKey();
            } elseif (is_object($this->certificate) && method_exists($this->certificate, 'getQueueableId')) {
                $this->certificateId = $this->certificate->getQueueableId();
            } elseif (is_array($this->certificate) && isset($this->certificate['id'])) {
                $this->certificateId = $this->certificate['id'];
            }
        }

        $certificate = SslCertificate::findOrFail($this->certificateId);
        try {
            Log::info("Iniciando criação de certificado SSL para {$certificate->domain_name}");

            // Log principal do job
            $jobLog = DeploymentLog::create([
                'type' => 'ssl_renewal',
                'action' => 'job_start',
                'status' => 'running',
                'payload' => [
                    'certificate_id' => $certificate->id,
                    'domain_name' => $certificate->domain_name,
                ],
                'started_at' => now(),
            ]);

            // Mantém 'pending' até a conclusão para respeitar enum permitido

            $letsEncryptService = app(LetsEncryptService::class);
            $result = $letsEncryptService->issueCertificate($certificate);

            if ($result['success']) {
                Log::info("Certificado SSL criado com sucesso para {$certificate->domain_name}");

                // Marcar log do job como sucesso
                if ($jobLog) {
                    $output = 'Emissão concluída com sucesso';
                    if (!empty($result['verification'])) {
                        $output .= "\n" . json_encode($result['verification']);
                    }
                    $jobLog->markAsSuccess($output);
                }

                // Broadcast event for real-time updates
                broadcast(new \App\Events\SslCertificateUpdated($certificate->fresh()));
            }
        } catch (\Exception $e) {
            Log::error("Erro ao criar certificado SSL para {$certificate->domain_name}: " . $e->getMessage());

            $certificate->update([
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
                        'certificate_id' => $certificate->id,
                        'domain_name' => $certificate->domain_name,
                    ],
                    'error' => $e->getMessage(),
                    'started_at' => now(),
                    'completed_at' => now(),
                ]);
            }

            // Broadcast error event
            broadcast(new \App\Events\SslCertificateUpdated($certificate->fresh()));

            throw $e;
        }
    }

    public function failed(\Throwable $exception): void
    {
        // Backward-compat: resolve id from legacy property if missing
        if (empty($this->certificateId) && isset($this->certificate)) {
            if ($this->certificate instanceof SslCertificate) {
                $this->certificateId = $this->certificate->getKey();
            } elseif (is_object($this->certificate) && method_exists($this->certificate, 'getQueueableId')) {
                $this->certificateId = $this->certificate->getQueueableId();
            } elseif (is_array($this->certificate) && isset($this->certificate['id'])) {
                $this->certificateId = $this->certificate['id'];
            }
        }

        $certificate = SslCertificate::find($this->certificateId);
        if ($certificate) {
            Log::error("Job falhou para certificado SSL {$certificate->domain_name}: " . $exception->getMessage());

            $certificate->update([
                'status' => 'failed',
                'last_error' => $exception->getMessage()
            ]);

            DeploymentLog::create([
                'type' => 'ssl_renewal',
                'action' => 'job_failed',
                'status' => 'failed',
                'payload' => [
                    'certificate_id' => $certificate->id,
                    'domain_name' => $certificate->domain_name,
                ],
                'error' => $exception->getMessage(),
                'started_at' => now(),
                'completed_at' => now(),
            ]);

            broadcast(new \App\Events\SslCertificateUpdated($certificate->fresh()));
            return;
        }
        Log::error('Job falhou e o certificado não foi encontrado para atualizar: ID '.$this->certificateId.'; erro: '.$exception->getMessage());
    }
}
