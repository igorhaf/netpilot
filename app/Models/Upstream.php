<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Upstream extends Model
{
    use HasFactory;

    protected $fillable = [
        'domain_id',
        'name',
        'target_url',
        'weight',
        'is_active',
        'health_check_path',
        'health_check_interval',
        'description'
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'weight' => 'integer',
        'health_check_interval' => 'integer',
    ];

    public function domain(): BelongsTo
    {
        return $this->belongsTo(Domain::class);
    }

    public function routeRules(): HasMany
    {
        return $this->hasMany(RouteRule::class);
    }
}
