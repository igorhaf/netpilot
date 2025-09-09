<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Resources\Json\JsonResource;

class ProxyRuleResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id' => $this->id,
            'tenant_id' => $this->tenant_id,
            'domain_id' => $this->domain_id,
            'source_host' => $this->source_host,
            'source_port' => $this->source_port,
            'target_host' => $this->target_host,
            'target_port' => $this->target_port,
            'protocol' => $this->protocol,
            'is_active' => $this->is_active,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
