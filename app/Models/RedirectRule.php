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
        'preserve_query',
        'conditions',
        'nginx_config',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'preserve_query' => 'boolean',
        'conditions' => 'array',
        'redirect_type' => 'integer',
        'priority' => 'integer',
    ];

    public function domain(): BelongsTo
    {
        return $this->belongsTo(Domain::class);
    }

    public function getRedirectTypeTextAttribute(): string
    {
        $types = [
            301 => 'Permanent (301)',
            302 => 'Temporary (302)',
            307 => 'Temporary Redirect (307)',
            308 => 'Permanent Redirect (308)',
        ];
        
        return $types[$this->redirect_type] ?? 'Unknown';
    }

    public function generateNginxConfig(): string
    {
        $config = "# Redirect Rule ID: {$this->id} - Priority: {$this->priority}\n";
        $config .= "location {$this->source_pattern} {\n";
        
        if ($this->conditions) {
            foreach ($this->conditions as $condition => $value) {
                switch ($condition) {
                    case 'user_agent':
                        $config .= "    if (\$http_user_agent ~* \"{$value}\") {\n";
                        break;
                    case 'remote_addr':
                        $config .= "    if (\$remote_addr = \"{$value}\") {\n";
                        break;
                }
            }
        }
        
        $redirectUrl = $this->target_url;
        if ($this->preserve_query) {
            $redirectUrl .= strpos($redirectUrl, '?') !== false ? '&$query_string' : '?$query_string';
        }
        
        $config .= "    return {$this->redirect_type} {$redirectUrl};\n";
        
        if ($this->conditions) {
            foreach ($this->conditions as $condition => $value) {
                $config .= "    }\n";
            }
        }
        
        $config .= "}\n";
        
        return $config;
    }
}