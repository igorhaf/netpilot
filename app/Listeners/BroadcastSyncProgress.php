<?php

namespace App\Listeners;

use App\Events\SyncProgress;

class BroadcastSyncProgress
{
    public function handle(SyncProgress $event): void
    {
        // The event itself implements ShouldBroadcast
        // No additional logic needed here
    }
}
