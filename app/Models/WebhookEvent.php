<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WebhookEvent extends Model
{
    use HasFactory;

    protected $fillable = [
        'webhook_id',
        'event_type',
        'payload',
        'response_code',
        'response_body',
        'attempts'
    ];

    protected $casts = [
        'payload' => 'array'
    ];

    public function webhook()
    {
        return $this->belongsTo(Webhook::class);
    }
}
