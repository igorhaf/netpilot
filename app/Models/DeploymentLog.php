<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DeploymentLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'type',
        'action',
        'status',
        'payload',
        'output',
        'error',
        'started_at',
        'completed_at',
        'duration',
    ];

    protected $casts = [
        'payload' => 'array',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function getDurationAttribute(): ?int
    {
        if (!$this->started_at || !$this->completed_at) {
            return null;
        }

        return $this->started_at->diffInSeconds($this->completed_at);
    }

    public function getIsRunningAttribute(): bool
    {
        return $this->status === 'running';
    }

    public function getIsSuccessAttribute(): bool
    {
        return $this->status === 'success';
    }

    public function getIsFailedAttribute(): bool
    {
        return $this->status === 'failed';
    }

    public function markAsRunning(): void
    {
        $this->update([
            'status' => 'running',
            'started_at' => now(),
        ]);
    }

    public function markAsSuccess(string $output = null): void
    {
        $duration = $this->started_at ? now()->diffInSeconds($this->started_at) : null;
        
        $this->update([
            'status' => 'success',
            'output' => $output,
            'completed_at' => now(),
            'duration' => $duration,
        ]);
    }

    public function markAsFailed(string $error): void
    {
        $duration = $this->started_at ? now()->diffInSeconds($this->started_at) : null;
        
        $this->update([
            'status' => 'failed',
            'error' => $error,
            'completed_at' => now(),
            'duration' => $duration,
        ]);
    }
}
