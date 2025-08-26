<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CertificateEvent extends Model
{
    use HasFactory;

    protected $fillable = [
        'domain_id',
        'event_type',
        'status',
        'domain',
        'payload'
    ];

    protected $casts = [
        'payload' => 'array',
    ];

    public function domain(): BelongsTo
    {
        return $this->belongsTo(Domain::class);
    }
}
