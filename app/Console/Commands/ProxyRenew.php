<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class ProxyRenew extends Command
{
    protected $signature = 'proxy:renew';
    protected $description = 'Trigger certificate renewal (stub)';

    public function handle(): int
    {
        $this->warn('RenewCertificate use case not implemented yet.');
        // TODO: implement RenewCertificate use case, create CertificateEvent
        return self::SUCCESS;
    }
}
