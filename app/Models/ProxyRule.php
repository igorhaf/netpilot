<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProxyRule extends Model
{
    use HasFactory;

    protected $fillable = [
        'domain_id',
        'source_host',
        'source_port',
        'target_host',
        'target_port',
        'protocol',
        'headers',
        'priority',
        'is_active',
        'nginx_config',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'headers' => 'array',
        'priority' => 'integer',
    ];

    public function domain(): BelongsTo
    {
        return $this->belongsTo(Domain::class);
    }

    public function getFullSourceAttribute()
    {
        $port = $this->source_port !== '80' ? ':' . $this->source_port : '';
        return $this->source_host . $port;
    }

    public function getFullTargetAttribute()
    {
        return $this->protocol . '://' . $this->target_host . ':' . $this->target_port;
    }

    public function generateNginxConfig(): string
    {
        $config = "server {\n";
        $config .= "    listen {$this->source_port};\n";
        $config .= "    server_name {$this->source_host};\n\n";

        if ($this->headers) {
            foreach ($this->headers as $header => $value) {
                $config .= "    add_header {$header} \"{$value}\";\n";
            }
            $config .= "\n";
        }

        $config .= "    location / {\n";
        $config .= "        proxy_pass {$this->full_target};\n";
        $config .= "        proxy_set_header Host \$host;\n";
        $config .= "        proxy_set_header X-Real-IP \$remote_addr;\n";
        $config .= "        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;\n";
        $config .= "        proxy_set_header X-Forwarded-Proto \$scheme;\n";
        $config .= "    }\n";
        $config .= "}\n";

        return $config;
    }
}
