<?php

namespace App\Services;

use App\Models\DeploymentLog;
use Illuminate\Support\Facades\Process;

class SystemCommandService
{
    /**
     * Executa um comando de sistema com logging detalhado
     */
    public function execute(string $type, string $action, string $command, array $payload = [], ?string $workingDirectory = null): array
    {
        $log = DeploymentLog::create([
            'type' => $type,
            'action' => $action,
            'status' => 'running',
            'payload' => array_merge($payload, [
                'command' => $command,
                'cwd' => $workingDirectory,
            ]),
            'started_at' => now(),
        ]);

        try {
            if (app()->environment('production')) {
                $process = $workingDirectory
                    ? Process::path($workingDirectory)->run($command)
                    : Process::run($command);

                if (!$process->successful()) {
                    $log->markAsFailed($process->errorOutput());
                    return [
                        'success' => false,
                        'exit_code' => $process->exitCode(),
                        'stdout' => $process->output(),
                        'stderr' => $process->errorOutput(),
                    ];
                }

                $log->markAsSuccess($process->output());
                return [
                    'success' => true,
                    'exit_code' => $process->exitCode(),
                    'stdout' => $process->output(),
                    'stderr' => $process->errorOutput(),
                ];
            }

            // Desenvolvimento: simular execução
            usleep(300 * 1000);
            $log->markAsSuccess("[SIMULATED] Comando executado com sucesso: {$command}");
            return [
                'success' => true,
                'exit_code' => 0,
                'stdout' => '[SIMULATED] ok',
                'stderr' => '',
            ];
        } catch (\Throwable $e) {
            $log->markAsFailed($e->getMessage());
            return [
                'success' => false,
                'exit_code' => 1,
                'stdout' => '',
                'stderr' => $e->getMessage(),
            ];
        }
    }
}
