<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AnalyticsData extends Model
{
    use HasFactory;

    protected $fillable = [
        'tenant_id',
        'type',
        'key',
        'value',
        'metadata'
    ];

    protected $casts = [
        'metadata' => 'array'
    ];
}
