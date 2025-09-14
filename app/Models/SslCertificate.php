<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class SslCertificate extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'tenant_id',
        'domain_id',
        'domain_name',
        'san_domains',
        'status',
        'issuer',
        'certificate_path',
        'private_key_path',
        'chain_path',
        'issued_at',
        'expires_at',
        'auto_renew',
        'renewal_days_before',
        'traefik_config',
        'last_error',
    ];

    protected $attributes = [
        // No default tenant_id - must be explicitly set
    ];

    protected $casts = [
        'san_domains' => 'array',
        'issued_at' => 'datetime',
        'expires_at' => 'datetime',
        'auto_renew' => 'boolean',
        'traefik_config' => 'array',
    ];

    public function domain(): BelongsTo
    {
        return $this->belongsTo(Domain::class);
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function getDaysUntilExpiryAttribute(): ?int
    {
        if (!$this->expires_at) return null;

        return Carbon::now()->diffInDays($this->expires_at, false);
    }

    public function getIsExpiringAttribute(): bool
    {
        if ($this->days_until_expiry === null) return false;
        return $this->days_until_expiry <= $this->renewal_days_before && $this->days_until_expiry > 0;
    }

    public function getIsExpiredAttribute(): bool
    {
        if ($this->days_until_expiry === null) return false;
        return $this->days_until_expiry <= 0;
    }

    public function getAllDomainsAttribute(): array
    {
        $domains = [$this->domain_name];

        if ($this->san_domains) {
            $domains = array_merge($domains, $this->san_domains);
        }

        return array_unique($domains);
    }

    public function generateTraefikConfig(): array
    {
        return [
            'tls' => [
                'certificates' => [
                    [
                        'certFile' => $this->certificate_path,
                        'keyFile' => $this->private_key_path,
                    ]
                ]
            ],
            'http' => [
                'routers' => [
                    $this->domain_name . '-router' => [
                        'rule' => 'Host(`' . implode('`, `', $this->all_domains) . '`)',
                        'tls' => [
                            'certResolver' => 'letsencrypt'
                        ]
                    ]
                ]
            ]
        ];
    }

    public function updateStatus(): void
    {
        if ($this->is_expired) {
            $this->update(['status' => 'expired']);
        } elseif ($this->is_expiring) {
            $this->update(['status' => 'expiring']);
        } elseif ($this->status === 'pending' && $this->certificate_path && file_exists($this->certificate_path)) {
            $this->update(['status' => 'valid']);
        }
    }
}
