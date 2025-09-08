<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class SyncProgress implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public string $message;
    public int $progress;
    public string $step;

    public function __construct(string $message, int $progress, string $step)
    {
        $this->message = $message;
        $this->progress = $progress;
        $this->step = $step;
    }

    public function broadcastOn(): Channel
    {
        return new Channel('sync-progress');
    }
}
