<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Webhook extends Model
{
    use HasFactory;

    protected $fillable = [
        'tenant_id',
        'name',
        'url',
        'secret',
        'events',
        'is_active'
    ];

    protected $casts = [
        'events' => 'array',
        'is_active' => 'boolean'
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }
}
