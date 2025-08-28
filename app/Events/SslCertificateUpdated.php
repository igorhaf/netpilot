<?php

namespace App\Events;

use App\Models\SslCertificate;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class SslCertificateUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public SslCertificate $certificate
    ) {}

    public function broadcastOn(): array
    {
        return [
            new Channel('ssl-certificates'),
            new Channel('ssl-certificate.' . $this->certificate->id),
        ];
    }

    public function broadcastWith(): array
    {
        return [
            'certificate' => [
                'id' => $this->certificate->id,
                'domain_id' => $this->certificate->domain_id,
                'domain_name' => $this->certificate->domain_name,
                'status' => $this->certificate->status,
                'last_error' => $this->certificate->last_error,
                'issued_at' => $this->certificate->issued_at,
                'expires_at' => $this->certificate->expires_at,
            ]
        ];
    }

    public function broadcastAs(): string
    {
        return 'ssl.certificate.updated';
    }
}
