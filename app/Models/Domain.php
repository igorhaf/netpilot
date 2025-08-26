<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Domain extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'auto_tls',
        'is_active'
    ];

    protected $casts = [
        'auto_tls' => 'boolean',
        'is_active' => 'boolean',
    ];

    public function upstreams(): HasMany
    {
        return $this->hasMany(Upstream::class);
    }

    public function routeRules(): HasMany
    {
        return $this->hasMany(RouteRule::class);
    }

    public function redirectRules(): HasMany
    {
        return $this->hasMany(RedirectRule::class);
    }
}
