<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RouteRule extends Model
{
    use HasFactory;

    protected $fillable = [
        'tenant_id',
        'domain_id',
        'upstream_id',
        'path_pattern',
        'http_method',
        'priority',
        'is_active',
        'strip_prefix',
        'preserve_host',
        'timeout',
        'description'
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'strip_prefix' => 'boolean',
        'preserve_host' => 'boolean',
        'priority' => 'integer',
        'timeout' => 'integer',
    ];

    public function domain(): BelongsTo
    {
        return $this->belongsTo(Domain::class);
    }

    public function upstream(): BelongsTo
    {
        return $this->belongsTo(Upstream::class);
    }
}
