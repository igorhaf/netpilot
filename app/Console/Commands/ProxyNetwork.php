<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Symfony\Component\Process\Process;

class ProxyNetwork extends Command
{
    protected $signature = 'proxy:network';
    protected $description = 'Ensure external proxy network exists';

    public function handle(): int
    {
        $network = config('netpilot.proxy_network', env('PROXY_NETWORK', 'proxy'));
        $sail = base_path('vendor/bin/sail');

        $check = new Process([$sail, 'docker', 'network', 'ls', '--format', '{{.Name}}']);
        $check->setTimeout(60);
        $check->run();

        if (str_contains($check->getOutput(), $network)) {
            $this->info("Network {$network} exists.");
            return self::SUCCESS;
        }

        $create = new Process([$sail, 'docker', 'network', 'create', $network]);
        $create->setTimeout(60);
        $create->run(function ($type, $buffer) { echo $buffer; });

        if (!$create->isSuccessful()) {
            $this->error("Failed to create network {$network}");
            return self::FAILURE;
        }

        $this->info("Created network {$network}");
        return self::SUCCESS;
    }
}
