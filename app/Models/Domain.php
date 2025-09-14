<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Domain extends Model
{
    use HasFactory;

    protected $fillable = [
        'tenant_id',
        'name',
        'description',
        'is_active',
        'auto_ssl',
        'dns_records',
        'force_https',
        'block_external_access',
        'internal_bind_ip',
        'security_headers',
        'www_redirect',
        'www_redirect_type',
    ];

    protected $attributes = [
        // No default tenant_id - must be explicitly set
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'auto_ssl' => 'boolean',
        'dns_records' => 'array',
        'force_https' => 'boolean',
        'block_external_access' => 'boolean',
        'security_headers' => 'array',
        'www_redirect' => 'boolean',
    ];

    public function proxyRules(): HasMany
    {
        return $this->hasMany(ProxyRule::class);
    }

    public function sslCertificates(): HasMany
    {
        return $this->hasMany(SslCertificate::class);
    }

    public function redirectRules(): HasMany
    {
        return $this->hasMany(RedirectRule::class);
    }

    public function getActiveProxyRulesAttribute()
    {
        return $this->proxyRules()->where('is_active', true)->get();
    }

    public function getCurrentCertificateAttribute()
    {
        return $this->sslCertificates()
            ->where('status', 'valid')
            ->orderBy('expires_at', 'desc')
            ->first();
    }

    public function getStatusAttribute()
    {
        if (!$this->is_active) return 'inactive';

        $hasActiveRules = $this->proxyRules()->where('is_active', true)->exists();
        $hasValidCert = $this->auto_ssl ? $this->getCurrentCertificateAttribute() !== null : true;

        if ($hasActiveRules && $hasValidCert) return 'active';
        if ($hasActiveRules && !$hasValidCert) return 'ssl_pending';

        return 'no_rules';
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }
}
