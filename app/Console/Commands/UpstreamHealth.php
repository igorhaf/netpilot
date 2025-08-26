<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Upstream;

class UpstreamHealth extends Command
{
    protected $signature = 'upstream:health {--id=* : Upstream IDs to check}';
    protected $description = 'Check upstream health (basic TCP connect)';

    public function handle(): int
    {
        $ids = $this->option('id');
        $query = Upstream::query();
        if (!empty($ids)) $query->whereIn('id', $ids);
        $ok = true;
        foreach ($query->get() as $up) {
            $host = $up->target;
            $port = $up->port;
            $this->line("Checking {$host}:{$port}...");
            $fp = @fsockopen($host, $port, $errno, $errstr, max(1, $up->timeout_ms/1000));
            if ($fp) { fclose($fp); $this->info("OK: {$host}:{$port}"); }
            else { $ok = false; $this->error("FAIL: {$host}:{$port} - {$errstr}"); }
        }
        return $ok ? self::SUCCESS : self::FAILURE;
    }
}
