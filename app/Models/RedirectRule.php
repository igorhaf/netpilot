<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RedirectRule extends Model
{
    use HasFactory;

    protected $fillable = [
        'domain_id',
        'source_pattern',
        'target_url',
        'redirect_type',
        'priority',
        'is_active',
        'preserve_query'
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'preserve_query' => 'boolean',
        'redirect_type' => 'integer',
        'priority' => 'integer',
    ];

    public function domain(): BelongsTo
    {
        return $this->belongsTo(Domain::class);
    }
}
