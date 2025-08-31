<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class SslCertificateExpiring
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public array $certificateData;

    /**
     * Create a new event instance.
     */
    public function __construct(array $certificateData)
    {
        $this->certificateData = $certificateData;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('ssl-alerts'),
        ];
    }

    /**
     * Get the data to broadcast.
     *
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'domain' => $this->certificateData['domain'] ?? 'Unknown',
            'days_until_expiry' => $this->certificateData['days'] ?? 0,
            'auto_renew_enabled' => $this->certificateData['auto_renew'] ?? false,
            'timestamp' => now()->toISOString(),
        ];
    }
}
