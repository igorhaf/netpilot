<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Tenant extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'is_active',
        'config'
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'config' => 'array'
    ];

    public function domains(): HasMany
    {
        return $this->hasMany(Domain::class);
    }

    public function proxyRules(): HasMany
    {
        return $this->hasMany(ProxyRule::class);
    }

    public function upstreams(): HasMany
    {
        return $this->hasMany(Upstream::class);
    }

    public function sslCertificates(): HasMany
    {
        return $this->hasMany(SslCertificate::class);
    }
}
